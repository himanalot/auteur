// Simple test to verify JavaScript is loading
console.log('🔥 TEST FILE LOADED!');
alert('TEST: JavaScript is working!');

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔥 DOM LOADED!');
    alert('TEST: DOM is ready!');
    
    // Test button click
    const testBtn = document.getElementById('createComp');
    if (testBtn) {
        console.log('🔥 Found createComp button!');
        testBtn.style.backgroundColor = 'red';
        testBtn.style.color = 'white';
        testBtn.textContent = 'TEST BUTTON FOUND!';
    } else {
        console.log('❌ createComp button not found');
        alert('createComp button not found!');
    }
});

// Test immediate execution
console.log('🔥 TEST: Script executed immediately'); 