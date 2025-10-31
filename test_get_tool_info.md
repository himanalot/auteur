# Manual Testing Examples for get_tool_info

## How to Test
Open the extension's Manual Tool Testing tab and try these examples:

## Test Cases

### 1. Test analyze_shape_properties (the new tool)
**Tool Name:** `get_tool_info`
**Parameters:**
```json
{
  "tool_name": "analyze_shape_properties"
}
```
**Expected:** Should return detailed info about the new tool for detecting rounded corners

### 2. Test delete_layers_by_name (the tool AI was using wrong parameters for)
**Tool Name:** `get_tool_info`
**Parameters:**
```json
{
  "tool_name": "delete_layers_by_name"
}
```
**Expected:** Should show that it needs `layerNames` parameter, not `names`

### 3. Test add_shape_modifiers (the tool AI was using wrong parameters for)
**Tool Name:** `get_tool_info`
**Parameters:**
```json
{
  "tool_name": "add_shape_modifiers"
}
```
**Expected:** Should show it works on selected layers only, no layer targeting parameters

### 4. Test animate_layer (frequently used tool)
**Tool Name:** `get_tool_info`
**Parameters:**
```json
{
  "tool_name": "animate_layer"
}
```
**Expected:** Should provide detailed parameter info and examples

### 5. Test select_layers (new tool we created)
**Tool Name:** `get_tool_info`
**Parameters:**
```json
{
  "tool_name": "select_layers"
}
```
**Expected:** Should return info about pattern, names, type parameters

### 6. Test non-existent tool (error case)
**Tool Name:** `get_tool_info`
**Parameters:**
```json
{
  "tool_name": "fake_tool_that_does_not_exist"
}
```
**Expected:** Should return error: "Tool not found: fake_tool_that_does_not_exist"

### 7. Test missing parameter (error case)
**Tool Name:** `get_tool_info`
**Parameters:**
```json
{}
```
**Expected:** Should return error: "tool_name parameter is required"

## What to Look For

### Good Results Should Include:
- `success: true`
- `name`: The exact tool name
- `description`: Clear description of what the tool does  
- `category`: Detected category (shape, layer, animation, etc.)
- `parameters`: Object with parameter definitions including types
- `usage_notes`: Specific notes about how to use the tool
- `examples`: Array of JSON examples showing proper usage

### Parameter Information Should Show:
- Parameter names (exact spelling)
- Parameter types (string, array, boolean, number)
- Whether parameters are optional
- Parameter descriptions

### Common Issues to Check:
- Are parameter names showing correctly? (`layerNames` vs `names`)
- Are examples showing proper JSON format?
- Do usage notes mention important requirements like "selected layers only"?
- Does the tool detection work for our newly added tools?

## Next Steps After Testing

If the tests work well, we should update the system prompt to tell the AI:
1. **Use get_tool_info for unfamiliar tools** before calling them
2. **Check parameter names** from the response
3. **Read usage notes** for special requirements
4. **Use examples** as templates for proper formatting 