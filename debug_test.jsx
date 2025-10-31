// Debug test - let's see what shows documentation
invalidObject.method();  // Unknown object
app.fakeMethod();  // Known object, invalid method  
app.project.fakeProperty;  // Known object chain, invalid property 