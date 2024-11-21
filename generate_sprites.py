from PIL import Image, ImageDraw
import math

def create_cat(size=(40, 40)):
    # Create a new image with transparency
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Colors
    cat_color = (100, 100, 100, 255)  # Gray
    ear_color = (80, 80, 80, 255)  # Darker gray
    eye_color = (0, 255, 255, 255)  # Cyan
    
    # Body
    draw.ellipse([5, 15, 35, 35], cat_color)  # Main body
    
    # Head
    draw.ellipse([10, 5, 30, 25], cat_color)  # Head
    
    # Ears
    draw.polygon([(12, 8), (18, 0), (22, 8)], ear_color)  # Left ear
    draw.polygon([(28, 8), (22, 0), (18, 8)], ear_color)  # Right ear
    
    # Eyes
    draw.ellipse([14, 12, 18, 16], eye_color)  # Left eye
    draw.ellipse([22, 12, 26, 16], eye_color)  # Right eye
    
    # Save the image
    img.save('assets/cat.png')

def create_car(color, filename):
    size = (60, 30)
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Main body
    draw.rectangle([10, 5, 50, 25], color)
    
    # Top
    draw.rectangle([20, 0, 40, 5], color)
    
    # Wheels
    wheel_color = (30, 30, 30, 255)
    draw.ellipse([5, 20, 15, 30], wheel_color)
    draw.ellipse([45, 20, 55, 30], wheel_color)
    
    img.save(f'assets/{filename}')

def create_background(size=(800, 600)):
    img = Image.new('RGB', size, (100, 200, 100))  # Green background
    draw = ImageDraw.Draw(img)
    
    # Draw roads
    road_color = (80, 80, 80)
    for y in range(100, size[1]-100, 60):
        draw.rectangle([0, y, size[0], y+40], road_color)
        
        # Draw road lines
        line_color = (255, 255, 255)
        for x in range(0, size[0], 40):
            draw.rectangle([x, y+18, x+20, y+22], line_color)
    
    img.save('assets/background.png')

def create_powerup(size=(30, 30)):
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Star shape
    star_color = (255, 215, 0, 255)  # Gold
    center_x, center_y = size[0] // 2, size[1] // 2
    radius_outer = 12
    radius_inner = 5
    points = []
    
    for i in range(10):
        angle = i * 36 * 3.14159 / 180
        radius = radius_outer if i % 2 == 0 else radius_inner
        x = center_x + radius * math.cos(angle)
        y = center_y + radius * math.sin(angle)
        points.append((x, y))
    
    draw.polygon(points, star_color)
    
    # Add glow effect
    glow_color = (255, 255, 200, 100)
    draw.ellipse([center_x-15, center_y-15, center_x+15, center_y+15], glow_color)
    
    img.save('assets/powerup.png')

def main():
    # Create cat sprite
    create_cat()
    
    # Create car sprites
    create_car((255, 0, 0, 255), 'car_red.png')  # Red car
    create_car((0, 0, 255, 255), 'car_blue.png')  # Blue car
    create_car((255, 255, 0, 255), 'car_yellow.png')  # Yellow car
    
    # Create background
    create_background()
    
    # Create power-up
    create_powerup()

if __name__ == '__main__':
    main()
    print("Sprites generated successfully!")
