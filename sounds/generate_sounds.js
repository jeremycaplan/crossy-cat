// This script generates game sound effects using Web Audio API
const fs = require('fs');
const { exec } = require('child_process');

// Generate a collect sound (high-pitched beep)
const collectSound = `
ffmpeg -f lavfi -i "sine=frequency=880:duration=0.1" -af "envelope=attack=0.005:decay=0.1" sounds/collect.mp3
`;

// Generate a crash sound (low noise burst)
const crashSound = `
ffmpeg -f lavfi -i "sine=frequency=150:duration=0.2" -af "envelope=attack=0.005:decay=0.2" sounds/crash.mp3
`;

// Generate a move sound (short click)
const moveSound = `
ffmpeg -f lavfi -i "sine=frequency=440:duration=0.05" -af "envelope=attack=0.001:decay=0.05" sounds/move.mp3
`;

// Execute the commands
exec(collectSound, (error) => {
    if (error) {
        console.error('Error generating collect sound:', error);
        return;
    }
    console.log('Generated collect sound');
});

exec(crashSound, (error) => {
    if (error) {
        console.error('Error generating crash sound:', error);
        return;
    }
    console.log('Generated crash sound');
});

exec(moveSound, (error) => {
    if (error) {
        console.error('Error generating move sound:', error);
        return;
    }
    console.log('Generated move sound');
});
