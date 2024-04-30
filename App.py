# from flask import Flask, request, jsonify
# import json
# import requests
# import os

# app = Flask(__name__)

# @app.route('/process_receipt', methods=['POST'])
# def process_receipt():
#     try:
#         if 'image' not in request.files:
#             return jsonify({'error': 'No file part'}), 400

#         image_file = request.files['image']
#         description = request.form.get('description', 'No description provided')
        
#         filepath = os.path.join('uploads', image_file.filename)
#         os.makedirs(os.path.dirname(filepath), exist_ok=True)
#         image_file.save(filepath)
        
#         print('Image received and saved successfully at', filepath)
#         print('Description:', description)  

#         url = 'https://ocr.asprise.com/api/v1/receipt'
#         with open(filepath, 'rb') as file:
#             files = {'file': file}
#             data = {
#                 'client_id': 'TEST',
#                 'recognizer': 'auto',
#                 'ref_no': 'oct_python_123'
#             }
#             response = requests.post(url, data=data, files=files)
#             response_data = response.json()  # Assuming the response is in JSON format

#         print('OCR API Response:', response_data)
#         return jsonify(response_data)

#     except Exception as e:
#         print('Error processing receipt:', e)
#         return jsonify({'error': str(e)}), 500

# if __name__ == '__main__':
#     app.run(debug=True, host='0.0.0.0')




from flask import Flask, request, jsonify, Response
from werkzeug.utils import secure_filename
import os
from PIL import Image
import torch
from transformers import DonutProcessor, VisionEncoderDecoderModel
import re
import json

app = Flask(__name__)

# Load the model and processor
device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')
processor = DonutProcessor.from_pretrained("AdamCodd/donut-receipts-extract")
model = VisionEncoderDecoderModel.from_pretrained("AdamCodd/donut-receipts-extract")
model.to(device)

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
        extracted_text = generate_text_from_image(model, image_file, processor, device)
        json_data = json.dumps({'extracted_text': extracted_text}, indent=4)

        return Response(json_data, mimetype='application/json')

    except Exception as e:
        error_message = json.dumps({'error': str(e)})
        return Response(error_message, status=500, mimetype='application/json')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
