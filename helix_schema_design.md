# HelixDB Schema Design for After Effects Project Context

## Overview

This document defines the HelixDB knowledge graph schema for representing After Effects project structure as a traversable graph. The schema enables intelligent context discovery for autonomous agents working with AE projects.

## Core Design Principles

1. **Content-Centric Nodes**: Nodes represent actual AE objects (compositions, layers, effects, etc.)
2. **Semantic Relationships**: Edges capture meaningful relationships (dependencies, hierarchy, influences)
3. **Vector Embeddings**: Text content (names, comments, expressions) are embedded for semantic search
4. **Temporal Awareness**: Time-based relationships for animation and keyframe dependencies
5. **Hierarchical Structure**: Preserve AE's nested structure while enabling cross-cutting relationships

## Node Types

### Project-Level Nodes

#### `Project`
- **Properties**: `name`, `file_path`, `num_items`, `timecode_base`, `bits_per_channel`
- **Vector Fields**: `name_embedding` (for semantic project search)
- **Purpose**: Root node representing the entire AE project

#### `ProjectFolder`
- **Properties**: `name`, `index`, `num_items`
- **Vector Fields**: `name_embedding`
- **Purpose**: Organizational folders within project panel

### Item Nodes

#### `Composition`
- **Properties**: `name`, `width`, `height`, `duration`, `frame_rate`, `pixel_aspect`, `work_area_start`, `work_area_duration`, `bg_color`, `num_layers`
- **Vector Fields**: `name_embedding`, `comment_embedding`
- **Purpose**: Composition items that contain layer hierarchies

#### `FootageItem`
- **Properties**: `name`, `width`, `height`, `duration`, `frame_rate`, `has_video`, `has_audio`, `file_path`
- **Vector Fields**: `name_embedding`, `file_path_embedding`
- **Purpose**: Source footage, images, audio files

#### `SolidItem`
- **Properties**: `name`, `width`, `height`, `color`
- **Vector Fields**: `name_embedding`
- **Purpose**: Solid color layers created within AE

### Layer Nodes

#### `AVLayer`
- **Properties**: `name`, `index`, `enabled`, `locked`, `in_point`, `out_point`, `start_time`, `stretch`, `blending_mode`, `quality`, `has_video`, `has_audio`
- **Vector Fields**: `name_embedding`, `comment_embedding`
- **Purpose**: Base audio/visual layers

#### `TextLayer` (extends AVLayer)
- **Properties**: All AVLayer props + `text_content`, `font`, `font_size`, `fill_color`, `stroke_color`, `justification`
- **Vector Fields**: `name_embedding`, `comment_embedding`, `text_content_embedding`
- **Purpose**: Text layers with typography information

#### `ShapeLayer` (extends AVLayer)
- **Properties**: All AVLayer props + `shape_data` (serialized shape structure)
- **Vector Fields**: `name_embedding`, `comment_embedding`, `shape_content_embedding`
- **Purpose**: Vector shape layers

#### `CameraLayer` (extends Layer)
- **Properties**: `name`, `index`, `enabled`, `camera_type`, `zoom`, `focus_distance`
- **Vector Fields**: `name_embedding`, `comment_embedding`
- **Purpose**: 3D camera layers

#### `LightLayer` (extends Layer)
- **Properties**: `name`, `index`, `enabled`, `light_type`, `intensity`, `color`, `cone_angle`
- **Vector Fields**: `name_embedding`, `comment_embedding`
- **Purpose**: 3D lighting layers

### Property Nodes

#### `Property`
- **Properties**: `name`, `match_name`, `value_type`, `current_value`, `num_keys`, `expression_enabled`
- **Vector Fields**: `name_embedding`, `expression_embedding`
- **Purpose**: Individual animatable properties

#### `PropertyGroup`
- **Properties**: `name`, `match_name`, `num_properties`
- **Vector Fields**: `name_embedding`
- **Purpose**: Collections of related properties (Transform, Effects, etc.)

#### `Effect`
- **Properties**: `name`, `match_name`, `enabled`, `effect_category`
- **Vector Fields**: `name_embedding`, `match_name_embedding`
- **Purpose**: Applied effects on layers

### Animation Nodes

#### `Keyframe`
- **Properties**: `time`, `value`, `in_interpolation`, `out_interpolation`, `property_path`
- **Purpose**: Individual keyframe data points

#### `Expression`
- **Properties**: `expression_text`, `language`, `target_property`
- **Vector Fields**: `expression_embedding`
- **Purpose**: JavaScript expressions driving properties

## Edge Types (Relationships)

### Hierarchical Relationships

#### `CONTAINS`
- **From**: Project → Composition, Project → FootageItem, Project → ProjectFolder
- **From**: ProjectFolder → Composition, ProjectFolder → FootageItem, ProjectFolder → ProjectFolder
- **From**: Composition → Layer (all types)
- **From**: Layer → PropertyGroup, PropertyGroup → Property, PropertyGroup → PropertyGroup
- **From**: Layer → Effect, Effect → Property
- **Properties**: `index` (order in container)

#### `PARENTS_TO`
- **From**: Layer → Layer (parenting relationship)
- **Properties**: None
- **Purpose**: Layer parenting hierarchy

### Source Dependencies

#### `USES_SOURCE`
- **From**: AVLayer → FootageItem, AVLayer → Composition, AVLayer → SolidItem
- **Properties**: None
- **Purpose**: Layer source relationships

#### `PRECOMPS_IN`
- **From**: Composition → Composition (precomp usage)
- **Properties**: `time_offset`, `layer_index`
- **Purpose**: Track precomposition dependencies

### Animation Relationships

#### `HAS_KEYFRAME`
- **From**: Property → Keyframe
- **Properties**: `keyframe_index`
- **Purpose**: Property animation data

#### `DRIVES_WITH_EXPRESSION`
- **From**: Expression → Property
- **Properties**: None
- **Purpose**: Expression-driven properties

#### `REFERENCES_IN_EXPRESSION`
- **From**: Expression → Property, Expression → Layer, Expression → Composition
- **Properties**: `reference_type` ("pickwhip", "index", "name")
- **Purpose**: Expression dependencies on other objects

### Temporal Relationships

#### `ACTIVE_AT_TIME`
- **From**: Layer → Keyframe (when layer is active during this keyframe)
- **Properties**: `time_range_start`, `time_range_end`
- **Purpose**: Time-based layer visibility

#### `INFLUENCES_AT_TIME`
- **From**: Layer → Layer (when one layer influences another at specific times)
- **Properties**: `time_start`, `time_end`, `influence_type` ("parenting", "expression", "effect")
- **Purpose**: Temporal dependency tracking

### Semantic Relationships

#### `SIMILAR_NAME`
- **From**: Any node → Any node (computed via vector similarity)
- **Properties**: `similarity_score`
- **Purpose**: Semantically related elements

#### `SIMILAR_FUNCTION`
- **From**: Effect → Effect, Property → Property
- **Properties**: `similarity_score`, `function_category`
- **Purpose**: Functionally similar elements

## Vector Embedding Strategy

### Text Embedding Sources
1. **Names**: All object names for semantic search
2. **Comments**: User comments and descriptions
3. **Expressions**: JavaScript code for functional similarity
4. **File Paths**: Source file paths for asset organization
5. **Effect Match Names**: For effect categorization and similarity

### Embedding Model
- **Model**: Google text-embedding-004 (already used in current RAG system)
- **Dimension**: 768
- **Context Window**: 8192 tokens

### Search Strategies
1. **Semantic Name Search**: Find similarly named elements
2. **Functional Search**: Find elements with similar purposes
3. **Content Search**: Search within expressions and comments
4. **Asset Search**: Find related source files and compositions

## Graph Traversal Patterns

### Basic Navigation
- **Hierarchical Down**: Project → Folders/Comps → Layers → Properties
- **Hierarchical Up**: Property → Layer → Composition → Project
- **Sibling Navigation**: Layer → Layer (same composition)

### Dependency Analysis
- **Source Tracing**: Layer → Source Item → Usage (what uses this source)
- **Expression Dependencies**: Property → Expression → Referenced Objects
- **Parenting Chain**: Layer → Parent → Parent (full hierarchy)

### Temporal Analysis
- **Active Elements**: Find what's active at specific time
- **Animation Flow**: Keyframe → Property → Layer → Dependencies
- **Influence Mapping**: What influences what during time ranges

### Semantic Discovery
- **Similar Elements**: Vector search for related objects
- **Functional Groups**: Find elements serving similar purposes
- **Content Patterns**: Discover repeated patterns in expressions/effects

## Implementation Notes

### Data Ingestion Pipeline
1. **Extract**: Use existing `jsx/export_project.jsx` to get JSON structure
2. **Transform**: Convert flat JSON to graph nodes and edges
3. **Embed**: Generate vector embeddings for text content
4. **Load**: Insert into HelixDB using batch operations

### Query Optimization
- **Index Strategy**: Primary indices on node types, secondary on relationships
- **Batch Operations**: Group related queries for performance
- **Caching**: Cache frequently accessed project structures

### Update Strategy
- **Incremental Updates**: Only update changed project elements
- **Version Tracking**: Track project modification timestamps
- **Differential Sync**: Compare current vs. last known state

This schema provides a comprehensive foundation for representing After Effects projects as knowledge graphs while maintaining performance and enabling intelligent agent traversal.