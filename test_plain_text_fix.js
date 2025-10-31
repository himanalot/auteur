require('dotenv').config({ path: './backend/.env' });
const fetch = require('node-fetch');

async function testPlainTextFix() {
  const apiKey = process.env.CLAUDE_API_KEY;
  
  console.log('🔧 ===== TESTING PLAIN TEXT DOCUMENTATION FIX =====\n');
  
  // Simulate the new approach with plain text documentation
  const requestData = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    temperature: 0.7,
    stream: false,
    system: 'You are an AI assistant helping with After Effects ExtendScript development. Provide detailed, helpful responses based on the documentation provided. Include specific information, code examples, and practical guidance when available.',
    messages: [
      {
        role: 'user',
        content: 'What are the different types of layers in After Effects? Please quote specific documentation about Layer, AVLayer, and TextLayer objects with their exact descriptions and properties.'
      },
      {
        role: 'assistant',
        content: 'I\'ll search for information about layers in After Effects ExtendScript to give you a comprehensive overview.'
      },
      {
        role: 'user',
        content: `Here is the documentation found for your question:

# Layer object

\`app.project.item(index).layer(index)\`

#### Description

The Layer object provides access to layers within compositions. It can be accessed from an item's layer collection either by index number or by a name string.

Layer is a subclass of PropertyGroup, which is a subclass of PropertyBase. All methods and attributes of PropertyGroup, in addition to those listed below, are available when working with Layer, with the exception that propertyIndex attribute is set to undefined.

Layer is the base class for CameraLayer object, LightLayer object, and AVLayer object, so Layer attributes and methods are available when working with all layer types. Layers contain AE properties, in addition to their JavaScript attributes and methods.

---

# AVLayer object

\`app.project.item(index).layer(index)\`

#### Description

The AVLayer object provides an interface to those layers that contain AVItem objects (composition layers, footage layers, solid layers, text layers, and sound layers).

AVLayer is a subclass of Layer object. All methods and attributes of Layer, in addition to those listed below, are available when working with AVLayer.

AVLayer is a base class for TextLayer object, so AVLayer attributes and methods are available when working with TextLayer objects.

#### AE Properties

Different types of layers have different AE properties. AVLayer has the following properties and property groups:

- Marker
- Time Remap
- Motion Trackers
- Masks
- Effects
- Transform
    - Anchor Point
    - Position
    - Scale
    - Orientation
    - X Rotation
    - Y Rotation
    - Rotation
    - Opacity

Please provide a comprehensive answer based on this documentation.`
      }
    ]
  };
  
  try {
    console.log('📤 Sending request with plain text documentation...');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'tools-2024-04-04'
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      console.error('❌ Request failed:', response.status, await response.text());
      return;
    }

    const result = await response.json();
    console.log('📥 Claude Response:');
    console.log('   Stop reason:', result.stop_reason);
    console.log('   Content blocks:', result.content?.length || 0);
    console.log('   Usage:', result.usage);
    
    if (result.content && result.content.length > 0) {
      const textContent = result.content.find(block => block.type === 'text');
      if (textContent) {
        console.log('✅ SUCCESS: Claude responded with comprehensive content');
        console.log('   Content length:', textContent.text.length);
        console.log('   Content preview:');
        console.log('   ---');
        console.log('   ' + textContent.text.substring(0, 800) + (textContent.text.length > 800 ? '...' : ''));
        console.log('   ---');
        
        // Verify it includes documentation quotes
        const hasLayerQuotes = textContent.text.includes('Layer object') || textContent.text.includes('provides access to layers');
        const hasAVLayerQuotes = textContent.text.includes('AVLayer object') || textContent.text.includes('AVItem objects');
        
        console.log('📋 Content Analysis:');
        console.log('   Includes Layer documentation:', hasLayerQuotes ? '✅' : '❌');
        console.log('   Includes AVLayer documentation:', hasAVLayerQuotes ? '✅' : '❌');
        console.log('   Response length acceptable:', textContent.text.length > 500 ? '✅' : '❌');
        
      } else {
        console.log('❌ FAILED: No text content in response');
      }
    } else {
      console.log('❌ FAILED: Empty content array');
      console.log('   Full response:', JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }

  console.log('\n🔧 ===== END PLAIN TEXT FIX TEST =====');
}

testPlainTextFix();