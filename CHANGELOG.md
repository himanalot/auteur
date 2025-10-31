# Changelog

All notable changes to the Maximise AE Tools extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-27

### Added
- **Composition Tools**
  - Create Standard Composition (1920x1080, 30fps, 10s duration)
  - Duplicate Active Composition with proper naming
  - Organize Compositions into folders automatically

- **Layer Tools**
  - Add Null Object (centered, labeled, red color)
  - Center Anchor Points for selected layers
  - Distribute Layers Vertically with even spacing
  - Distribute Layers Horizontally with even spacing

- **Animation Tools**
  - Easy Ease Selected Keyframes with optimal curves
  - Sequence Layers with customizable frame offset

- **Text Tools**
  - Create Text Layer with custom content and styling
  - Animate Text In with fade and scale effects

- **Export Tools**
  - Add Active Composition to Render Queue
  - Export Current Frame as PNG

- **User Interface**
  - Modern, responsive design with dark theme support
  - Sidebar panel compatibility with docking support
  - Real-time status feedback for all operations
  - Organized tool categories with clear sections

- **Technical Features**
  - CEP 11.0 compatibility for After Effects 2025
  - Comprehensive error handling and user feedback
  - Undo group support for all operations
  - Clean, maintainable codebase structure

### Technical Details
- **Supported Versions**: After Effects 2025 (22.0+)
- **CEP Version**: 11.0
- **Extension Type**: Dockable Panel
- **Minimum Panel Size**: 250x300px
- **Recommended Size**: 280x600px

### Installation
- Manual installation to CEP extensions directory
- Debug mode enablement for unsigned extensions
- Automatic panel registration and menu integration 