from flask import Flask, request, jsonify, Response
from werkzeug.utils import secure_filename
import os
from PIL import Image
import torch
from transformers import DonutProcessor, VisionEncoderDecoderModel
import re
import json

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Load the model and processor
device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')
processor = DonutProcessor.from_pretrained("AdamCodd/donut-receipts-extract")
model = VisionEncoderDecoderModel.from_pretrained("AdamCodd/donut-receipts-extract")
model.to(device)

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def load_and_preprocess_image(image, processor):
    image = Image.open(image).convert("RGB")
    pixel_values = processor(image, return_tensors="pt").pixel_values
    return pixel_values

def generate_text_from_image(model, image, processor, device):
    pixel_values = load_and_preprocess_image(image, processor)
    pixel_values = pixel_values.to(device)
    model.eval()
    with torch.no_grad():
        task_prompt = "<s_receipt>"
        decoder_input_ids = processor.tokenizer(task_prompt, add_special_tokens=False, return_tensors="pt").input_ids
        decoder_input_ids = decoder_input_ids.to(device)
        generated_outputs = model.generate(
            pixel_values,
            decoder_input_ids=decoder_input_ids,
            max_length=model.decoder.config.max_position_embeddings,
            pad_token_id=processor.tokenizer.pad_token_id,
            eos_token_id=processor.tokenizer.eos_token_id,
            early_stopping=True,
            bad_words_ids=[[processor.tokenizer.unk_token_id]],
            return_dict_in_generate=True
        )
    decoded_text = processor.batch_decode(generated_outputs.sequences)[0]
    decoded_text = decoded_text.replace(processor.tokenizer.eos_token, "").replace(processor.tokenizer.pad_token, "")
    decoded_text = re.sub(r"<.*?>", "", decoded_text, count=1).strip()
    decoded_text = processor.token2json(decoded_text)
    return decoded_text

@app.route('/process_receipt', methods=['POST'])
def process_receipt():
    try:
        if 'image' not in request.files:
            return Response("{'error': 'No file part'}", status=400, mimetype='application/json')
    
        image_file = request.files['image']

        if image_file.filename == '':
            return Response("{'error': 'No selected file'}", status=400, mimetype='application/json')

        if image_file and allowed_file(image_file.filename):
            filename = secure_filename(image_file.filename)
            image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            image_file.save(image_path)
        else:
            return Response("{'error': 'Invalid file format'}", status=400, mimetype='application/json')

        extracted_text = generate_text_from_image(model, image_file, processor, device)
        json_data = json.dumps({'extracted_text': extracted_text, 'image_path': image_path}, indent=4)

        return Response(json_data, mimetype='application/json')

    except Exception as e:
        error_message = json.dumps({'error': str(e)})
        return Response(error_message, status=500, mimetype='application/json')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
