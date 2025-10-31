module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  overrides: [
    {
      files: ['jsx/**/*.jsx'],
      env: {
        browser: true
      },
      globals: {
        // Core AE objects
        $: true,
        app: true,
        alert: true,
        CompItem: true,
        System: true,
        File: true,
        Folder: true,
        module: true,
        
        // Layer types
        AVLayer: true,
        TextLayer: true,
        ShapeLayer: true,
        CameraLayer: true,
        LightLayer: true,
        
        // Property types
        PropertyGroup: true,
        PropertyType: true,
        PropertyValueType: true,
        KeyframeInterpolationType: true,
        KeyframeEase: true,
        
        // Shape related
        Shape: true,
        MaskMode: true,
        
        // Text related
        ParagraphJustification: true,
        
        // Source types
        FootageItem: true,
        FolderItem: true,
        SolidSource: true,
        ImportOptions: true,
        ImportAsType: true,
        
        // Render Queue
        RQItemStatus: true,
        LogType: true,
        
        // Camera & Light
        CameraType: true,
        LightType: true,
        LayerQuality: true,
        BlendingMode: true,
        PurgeTarget: true,
        
        // Utility
        MarkerValue: true,
        ExternalObject: true,
        AECommand: true
      },
      parserOptions: {
        ecmaVersion: 3,
        sourceType: 'script'
      },
      rules: {
        'no-var': 'off',
        'prefer-const': 'off',
        'no-undef': 'error',
        'semi': ['error', 'always'],
        'quotes': ['error', 'double'],
        'no-unused-vars': 'off',
        'no-console': 'off'
      }
    }
  ]
};