import pygame
import random
import os

# Initialize Pygame and its mixer
pygame.init()
pygame.mixer.init()

# Set up the display
WINDOW_WIDTH = 800
WINDOW_HEIGHT = 600
screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
pygame.display.set_caption("Crossy Cat")

# Load images
current_dir = os.path.dirname(os.path.abspath(__file__))
cat_img = pygame.image.load(os.path.join(current_dir, 'assets', 'cat.png'))
car_imgs = [
    pygame.image.load(os.path.join(current_dir, 'assets', 'car_red.png')),
    pygame.image.load(os.path.join(current_dir, 'assets', 'car_blue.png')),
    pygame.image.load(os.path.join(current_dir, 'assets', 'car_yellow.png'))
]
powerup_img = pygame.image.load(os.path.join(current_dir, 'assets', 'powerup.png'))

# Game properties
SCROLL_SPEED = 1
FORCE_FORWARD_INTERVAL = 120
POWERUP_CHANCE = 0.1
POWERUP_BONUS = 50

# Player (Cat) properties
cat_width = 40
cat_height = 40
cat_x = WINDOW_WIDTH // 2
cat_y = WINDOW_HEIGHT - 120
cat_speed = 4

# Road properties
road_height = 40
road_spacing = 60
roads = []
scroll_offset = 0
frames_since_move = 0

# Car properties
cars = []

# Power-up properties
powerups = []

# Game states
PLAYING = 'playing'
GAME_OVER = 'game_over'
game_state = PLAYING

# Initialize score
score = 0
high_score = 0
distance = 0

class Road:
    def __init__(self, y):
        self.y = y
        self.cars = []
        self.has_powerup = random.random() < POWERUP_CHANCE
        if self.has_powerup:
            self.powerup_x = random.randint(0, WINDOW_WIDTH - 30)
            self.powerup_collected = False

def spawn_car(road_y):
    """Spawn a new car at given road y position"""
    speed = random.randint(2, 4)
    car_type = random.randint(0, 2)
    
    # Randomly choose left or right side
    if random.choice([True, False]):
        return {'x': -60, 'y': road_y, 'speed': speed, 'type': car_type}
    else:
        return {'x': WINDOW_WIDTH, 'y': road_y, 'speed': -speed, 'type': car_type}

def reset_game():
    """Reset the game state"""
    global cat_x, cat_y, roads, cars, score, game_state, distance, scroll_offset, frames_since_move
    cat_x = WINDOW_WIDTH // 2
    cat_y = WINDOW_HEIGHT - 120
    roads = [Road(y) for y in range(0, WINDOW_HEIGHT + road_spacing, road_spacing)]
    cars = []
    score = 0
    distance = 0
    scroll_offset = 0
    frames_since_move = 0
    game_state = PLAYING

def draw_game_over():
    """Draw game over screen"""
    overlay = pygame.Surface((WINDOW_WIDTH, WINDOW_HEIGHT))
    overlay.fill((0, 0, 0))
    overlay.set_alpha(128)
    screen.blit(overlay, (0, 0))
    
    font = pygame.font.Font(None, 74)
    game_over_text = font.render('Game Over!', True, (255, 255, 255))
    score_text = font.render(f'Score: {score}', True, (255, 255, 255))
    high_score_text = font.render(f'High Score: {high_score}', True, (255, 255, 255))
    restart_text = font.render('Press SPACE to restart', True, (255, 255, 255))
    
    screen.blit(game_over_text, (WINDOW_WIDTH//2 - game_over_text.get_width()//2, WINDOW_HEIGHT//2 - 100))
    screen.blit(score_text, (WINDOW_WIDTH//2 - score_text.get_width()//2, WINDOW_HEIGHT//2))
    screen.blit(high_score_text, (WINDOW_WIDTH//2 - high_score_text.get_width()//2, WINDOW_HEIGHT//2 + 60))
    screen.blit(restart_text, (WINDOW_WIDTH//2 - restart_text.get_width()//2, WINDOW_HEIGHT//2 + 120))

# Initialize roads
reset_game()

# Game loop
running = True
clock = pygame.time.Clock()

while running:
    # Handle events
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    if game_state == PLAYING:
        # Handle keyboard input
        keys = pygame.key.get_pressed()
        if keys[pygame.K_LEFT] and cat_x > 0:
            cat_x -= cat_speed
        if keys[pygame.K_RIGHT] and cat_x < WINDOW_WIDTH - cat_width:
            cat_x += cat_speed
        
        # Force forward movement after interval
        frames_since_move += 1
        if frames_since_move >= FORCE_FORWARD_INTERVAL:
            cat_y -= cat_speed
            frames_since_move = 0
        
        # Scroll the world
        scroll_offset += SCROLL_SPEED
        if scroll_offset >= road_spacing:
            scroll_offset = 0
            # Remove bottom road and add new one at top
            roads.pop()
            new_y = roads[0].y - road_spacing
            roads.insert(0, Road(new_y))
            distance += 1
            score = distance
        
        # Update road positions
        for road in roads:
            road.y += SCROLL_SPEED
            
            # Spawn cars randomly
            if random.random() < 0.01:
                cars.append(spawn_car(road.y))
        
        # Update car positions
        for car in cars[:]:
            car['x'] += car['speed']
            car['y'] += SCROLL_SPEED
            # Remove cars that are off screen
            if car['x'] < -60 or car['x'] > WINDOW_WIDTH or car['y'] > WINDOW_HEIGHT:
                cars.remove(car)
        
        # Check for collisions with cars
        cat_rect = pygame.Rect(cat_x + 5, cat_y + 5, cat_width - 10, cat_height - 10)
        for car in cars:
            car_rect = pygame.Rect(car['x'] + 5, car['y'] + 5, 50, 20)
            if cat_rect.colliderect(car_rect):
                game_state = GAME_OVER
                high_score = max(score, high_score)
        
        # Check for power-up collection
        for road in roads:
            if road.has_powerup and not road.powerup_collected:
                powerup_rect = pygame.Rect(road.powerup_x, road.y, 30, 30)
                if cat_rect.colliderect(powerup_rect):
                    score += POWERUP_BONUS
                    road.powerup_collected = True
        
        # Keep cat on screen
        cat_y = min(max(0, cat_y), WINDOW_HEIGHT - cat_height)
        
    elif game_state == GAME_OVER and pygame.key.get_pressed()[pygame.K_SPACE]:
        reset_game()

    # Draw everything
    screen.fill((100, 200, 100))  # Green background
    
    # Draw roads
    for road in roads:
        pygame.draw.rect(screen, (80, 80, 80), (0, road.y, WINDOW_WIDTH, road_height))
        # Draw road lines
        for x in range(0, WINDOW_WIDTH, 40):
            pygame.draw.rect(screen, (255, 255, 255), (x, road.y + 18, 20, 4))
        # Draw power-up if not collected
        if road.has_powerup and not road.powerup_collected:
            screen.blit(powerup_img, (road.powerup_x, road.y + 5))
    
    # Draw cars
    for car in cars:
        car_image = car_imgs[car['type']]
        if car['speed'] < 0:
            car_image = pygame.transform.flip(car_image, True, False)
        screen.blit(car_image, (car['x'], car['y']))
    
    # Draw cat
    screen.blit(cat_img, (cat_x, cat_y))
    
    # Draw score
    font = pygame.font.Font(None, 36)
    score_text = font.render(f'Score: {score}', True, (255, 255, 255))
    screen.blit(score_text, (10, 10))
    
    if game_state == GAME_OVER:
        draw_game_over()

    # Update display
    pygame.display.flip()
    
    # Control game speed
    clock.tick(60)

pygame.quit()