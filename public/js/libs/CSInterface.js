/**
 * CSInterface - Communication bridge between CEP panel and host application
 */

function CSInterface() {
    this.hostEnvironment = this.getHostEnvironment();
}

CSInterface.prototype.getHostEnvironment = function() {
    var hostEnv = window.__adobe_cep__.getHostEnvironment();
    return JSON.parse(hostEnv);
};

CSInterface.prototype.evalScript = function(script, callback) {
    if (callback === null || callback === undefined) {
        callback = function(result) {};
    }
    window.__adobe_cep__.evalScript(script, callback);
};

CSInterface.prototype.addEventListener = function(type, listener, obj) {
    window.__adobe_cep__.addEventListener(type, listener, obj);
};

CSInterface.prototype.removeEventListener = function(type, listener, obj) {
    window.__adobe_cep__.removeEventListener(type, listener, obj);
};

CSInterface.prototype.requestOpenExtension = function(extensionId, params) {
    window.__adobe_cep__.requestOpenExtension(extensionId, params);
};

CSInterface.prototype.dispatchEvent = function(event) {
    if (typeof event.data == "object") {
        event.data = JSON.stringify(event.data);
    }
    window.__adobe_cep__.dispatchEvent(event);
};

CSInterface.prototype.closeExtension = function() {
    window.__adobe_cep__.closeExtension();
};

CSInterface.prototype.getSystemPath = function(pathType) {
    var path = decodeURI(window.__adobe_cep__.getSystemPath(pathType));
    var OSVersion = this.getOSInformation();
    if (OSVersion.indexOf("Windows") >= 0) {
        path = path.replace("file:///", "");
    } else if (OSVersion.indexOf("Mac") >= 0) {
        path = path.replace("file://", "");
    }
    return path;
};

CSInterface.prototype.getOSInformation = function() {
    var userAgent = navigator.userAgent;
    if (navigator.platform == "Win32" || navigator.platform == "Windows") {
        return "Windows";
    } else if (navigator.platform == "MacIntel" || navigator.platform == "Macintosh") {
        return "Mac";
    }
    return "Unknown";
};

CSInterface.prototype.openURLInDefaultBrowser = function(url) {
    window.__adobe_cep__.openURLInDefaultBrowser(url);
};

CSInterface.prototype.getExtensionID = function() {
    return window.__adobe_cep__.getExtensionId();
};

CSInterface.prototype.registerInvalidCertificateCallback = function(callback) {
    window.__adobe_cep__.registerInvalidCertificateCallback(callback);
};

CSInterface.prototype.registerKeyEventsInterest = function(keyEventsInterest) {
    return window.__adobe_cep__.registerKeyEventsInterest(JSON.stringify(keyEventsInterest));
};

CSInterface.prototype.setWindowTitle = function(title) {
    window.__adobe_cep__.invokeSync("setWindowTitle", title);
};

CSInterface.prototype.getWindowTitle = function() {
    return window.__adobe_cep__.invokeSync("getWindowTitle", "");
};

// System Path constants
CSInterface.SystemPath = {
    USER_DATA: "userData",
    COMMON_FILES_X86: "commonFilesX86", 
    COMMON_FILES_X64: "commonFilesX64",
    COMMON_FILES: "commonFiles",
    MY_DOCUMENTS: "myDocuments",
    APPLICATION_DATA: "applicationData",
    EXTENSION: "extension",
    HOST_APPLICATION: "hostApplication"
};

// Event types
CSInterface.THEME_COLOR_CHANGED_EVENT = "com.adobe.csxs.events.ThemeColorChanged";

// Create CSEvent constructor
function CSEvent(type, scope, appId, extensionId) {
    this.type = type;
    this.scope = scope || "GLOBAL";
    this.appId = appId;
    this.extensionId = extensionId;
    this.data = "";
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CSInterface;
} 