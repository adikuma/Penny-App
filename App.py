from flask import Flask, request, jsonify
import json
import requests
import os

app = Flask(__name__)

@app.route('/process_receipt', methods=['POST'])
def process_receipt():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No file part'}), 400

        image_file = request.files['image']
        description = request.form.get('description', 'No description provided')  # Default to 'No description' if not provided
        
        # Save the image file with a specific path
        filepath = os.path.join('uploads', image_file.filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        image_file.save(filepath)
        
        print('Image received and saved successfully at', filepath)
        print('Description:', description)  # Print the additional string data

        # Send the image to the OCR API
        url = 'https://ocr.asprise.com/api/v1/receipt'
        with open(filepath, 'rb') as file:
            files = {'file': file}
            data = {
                'api_key': 'TEST',
                'recognizer': 'auto',
                'ref_no': 'oct_python_123'
            }
            response = requests.post(url, data=data, files=files)
            response_data = response.json()  # Assuming the response is in JSON format

        print('OCR API Response:', response_data)
        return jsonify(response_data)

    except Exception as e:
        print('Error processing receipt:', e)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
