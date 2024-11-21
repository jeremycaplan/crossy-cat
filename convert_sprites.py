import base64
import os
import json

def convert_images_to_base64():
    sprite_data = {}
    assets_dir = 'assets'
    
    for filename in os.listdir(assets_dir):
        if filename.endswith('.png'):
            filepath = os.path.join(assets_dir, filename)
            with open(filepath, 'rb') as image_file:
                encoded = base64.b64encode(image_file.read()).decode('utf-8')
                sprite_name = os.path.splitext(filename)[0]
                sprite_data[sprite_name] = f'data:image/png;base64,{encoded}'
    
    # Write to JavaScript file
    js_content = 'const SPRITE_DATA = ' + json.dumps(sprite_data, indent=2) + ';\n'
    
    with open('sprites.js', 'w') as js_file:
        js_file.write(js_content)

if __name__ == '__main__':
    convert_images_to_base64()
