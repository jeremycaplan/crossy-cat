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
                print(f'Converted {filename} to base64')
    
    # Write to JavaScript file with proper formatting
    js_content = 'const SPRITE_DATA = ' + json.dumps(sprite_data, indent=2) + ';\n'
    
    with open('sprites.js', 'w') as js_file:
        js_file.write(js_content)
        print('Generated sprites.js successfully')

if __name__ == '__main__':
    try:
        convert_images_to_base64()
        print('Sprite conversion completed successfully')
    except Exception as e:
        print(f'Error converting sprites: {e}')
