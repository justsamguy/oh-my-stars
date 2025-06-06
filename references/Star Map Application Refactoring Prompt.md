# Star Map Application Refactoring Prompt

## Context
You are tasked with refactoring a Three.js-based interactive star map application. The application currently displays an animated starfield with points of interest (POIs) and interactive UI elements implemented using CSS3D rendering.

## Current Structure
- **main.js**: Entry point and animation loop
- **config.js**: Application constants and POI definitions
- **sceneSetup.js**: Three.js scene initialization
- **stars.js**: Star rendering and shaders
- **interaction.js**: Event handling and UI interactions
- **utils.js**: Helper functions
- **layoutConfig.js**: UI layout configuration
- **style.css**: Application styling
- **index.html**: Main HTML document

## Refactoring Goals
- Improve code organization and maintainability
- Add proper state management
- Enhance type safety
- Improve error handling and logging
- Better separate concerns between core engine and features

## Specific Tasks
### Create a core engine layer
### Modularize features
### Add configuration management
### Implement logging and error handling

## Requirements

### Maintain existing functionality
- Animated starfield with parallax effect
- Interactive POIs with info boxes
- Responsive header/footer with glow effects
- Mobile support with bottom sheet UI
- Smooth scrolling and touch interactions

### Add new architectural features
- Centralized state management
- Event system for decoupled communication
- Proper error boundaries and logging
- Type safety with TypeScript
- Unit test support

### Performance considerations
- Maintain 60fps target
- Efficient memory usage
- Mobile device optimization
- Asset loading optimization

## Style Guide
- Use TypeScript for all new code
- Follow single responsibility principle
- Document public APIs
- Add unit tests for core functionality
- Use meaningful variable/function names
- Add comments for complex logic

## Migration Strategy
1. Set up new project structure
2. Add TypeScript and build tools
3. Migrate core functionality first
4. Refactor features one at a time
5. Add tests throughout
6. Maintain backward compatibility