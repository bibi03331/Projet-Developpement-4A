var IS_SAFARI = (typeof(safari) != "undefined");
var IS_CHROME = (typeof(chrome) != "undefined");
var IS_OPERA  = navigator.vendor.indexOf("Opera") != -1;
var extension = {};

(function() {
	"use strict";
	extension._locales = {};
	extension._version = null;
	
	extension.getExtensionVersion = function() {
		if(extension._version != null)
			return extension._version;
		
		// Safari
		if(IS_SAFARI) {
			var r = new XMLHttpRequest();
			r.open("GET", "Info.plist", false);
			r.send(null);
			var data = r.responseText;
			var currentVersion;
			$.each($(data).find("key"), function(index, key){
				if($(key).text() == 'CFBundleShortVersionString') {
					currentVersion = $(key).next().text();
				}
			});
			extension._version = currentVersion;
		}
		
		// Chrome
		else if(IS_CHROME) {
			var details = chrome.app.getDetails();
			extension._version = details.version;
		}
		return extension._version;
	};
	
	extension.getExtensionBundleVersion = function() {
		var r = new XMLHttpRequest();
		r.open("GET", extension.getResourceURL("Info.plist"), false);
		r.send(null);
		var data = r.responseText;
		var currentVersion;
		$.each($(data).find("key"), function(index, key) {
			if($(key).text() == 'CFBundleVersion') {
				currentVersion = parseInt($(key).next().text());
			}
		});
		return currentVersion;
	};
	
	extension._getBrowserLanguage = function() {
		var language = navigator.language.toLowerCase()
		var parts = language.split('-');
		if(parts.length === 2)
			language = parts[0].toLowerCase() + '_' + parts[1].toUpperCase();
		
		return language;
	};
	
	extension.getLocalizedString = function(name, substitutions, language) {
		if(!Array.isArray(substitutions)) {
			substitutions = new Array();
		}
		
		// Safari
		if(IS_SAFARI) {
			if(!language)
				language = extension._getBrowserLanguage();
			
			var locale = extension._getLocale(language);
			
			if(locale !== null && typeof locale === 'object' && typeof locale[name] === 'object' && typeof locale[name]["message"] === 'string')
				return prepareLocalizedMessage(locale[name], substitutions);
			
			else if(language.split('_').length == 2)
				return extension.getLocalizedString(name, substitutions, language.split('_')[0]);
			
			else if(language != "en") {
				console.warn("Could not find a translation for '%s' for language %s, falling back to English.", name, language);
				return extension.getLocalizedString(name, substitutions, "en");
			}
			else {
				console.warn("Could not find a message for '%s.'", name);
				return name;
			}
		}
		
		// Chrome
		else if(IS_CHROME) {
			var message = chrome.i18n.getMessage(name, substitutions);
			if(message == null || message.length == 0 || message == name) {
				console.warn("Could not find an translation for '" + name + "'.");
				message = name;
			}
			return message
		}
	};
	
	function prepareLocalizedMessage(localization, substitutions)
	{
		var message = localization.message;
		
		if(typeof localization.placeholders === "object")
		{
			var placeholders = localization.placeholders;
			for (var placeholder in localization.placeholders)
			{
				if(localization.placeholders.hasOwnProperty(placeholder) && typeof placeholders[placeholder].content === "string")
				{
					var parameterIndex = parseInt(placeholders[placeholder].content.replace("$", "")) - 1;
					if(!isNaN(parameterIndex))
					{
						var substitution = substitutions[parameterIndex] ? substitutions[parameterIndex] : "";
						message = message.replace("$" + placeholder + "$", substitution);
					}
				}
			}
		}
		return message;
	}
	
	/**
	* Returns the object with localizations for the specified language and
	* caches the localization file to limit file read actions. Returns null
	* if the localization is not available.
	**/
	extension._getLocale = function(language) {
		if(typeof extension._locales[language] === 'object')
			return extension._locales[language];
		else {
			try {
				var url = safari.extension.baseURI + "_locales/" + language + "/messages.json";
				var r = new XMLHttpRequest();
				r.open("GET", url, false);
				r.send(null);
				var data = $.parseJSON(r.responseText);
				extension._locales[language] = data;
			} catch(e){
				extension._locales[language] = null;
			}
			return extension._locales[language];
		}
	};
	
	/* !Storage */
	extension.storage = {};
	extension.storage.set = function(object, callback) {
		if(IS_SAFARI) {
			for (var key in object) {
				try {
					var json = JSON.stringify(object[key]);
					safari.extension.secureSettings.setItem(key, json);
				}
				catch(exception) {
					console.warn("Error while storing item with key %s", key);
				}
			}
			if(typeof callback === "function")
				callback();
		}
		
		if (IS_CHROME) {
			chrome.storage.local.set(object, callback);
		}
	};
	
	extension.storage.get = function(keys, callback) {
		if(!Array.isArray(keys))
			keys = [keys];
		
		if(IS_SAFARI) {
			var result = {};
			for (var i = 0; i < keys.length; i++) {
				try {
					var json = safari.extension.secureSettings.getItem(keys[i]);
					result[keys[i]] = JSON.parse(json);
				}
				catch(exception) {
					console.log("Error while retreving storage item with key %s", keys[i]);
					result[keys[i]] = null;
				}
			}
			callback(result);
		}
		
		if(IS_CHROME) {
			chrome.storage.local.get(keys, function(storageItems) {
				if (!storageItems) {
					storageItems = {};
				}
				
				for (var i = 0; i < keys.length; i++) {
					if(typeof storageItems[keys[i]] === "undefined")
						storageItems[keys[i]] = null;
				}
				
				callback(storageItems);
			});
		}
	};
	
	extension.storage.remove = function(keys, callback) {
		if(!Array.isArray(keys))
			keys = [keys];
		
		if(IS_SAFARI) {
			for (var i = 0; i < keys.length; i++) {
				safari.extension.secureSettings.removeItem(keys[i]);
			}
			
			if(typeof callback === "function")
				callback();
		}
		
		if(IS_CHROME) {
			chrome.storage.local.remove(keys, callback);
		}
	};
	
	extension.storage.clear = function(callback) {
		if(IS_SAFARI) {
			safari.extension.secureSettings.clear();
			if(typeof callback === "function")
				callback();
		}
		
		if(IS_CHROME) {
			chrome.storage.local.clear(callback);
		}
	};
	
	extension.storage.addEventListener = function (eventHandler) {
		if(IS_SAFARI) {
			if (!safari.extension.secureSettings)
				return;
			var cachedChanges = {};
			
			safari.extension.secureSettings.addEventListener("change", function(event) {
				if(event.oldValue != event.newValue) {
					
					// Wait for other changes so they can be bundled in 1 event
					if(Object.keys(cachedChanges).length == 0) {
						setTimeout(function() {
							eventHandler(cachedChanges);
							cachedChanges = {};
						}, 1000);
					}
					
					cachedChanges[event.key] = { oldValue: event.oldValue, newValue: event.newValue };
				}
			}, false);
		}
		
		if(IS_CHROME) {
			chrome.storage.onChanged.addListener(function (changes, areaName) {
				if(areaName == "local") {
					eventHandler(changes);
				}
			});
		}
	};
	
	
	extension.getResourceURL = function(file) {
		if(IS_SAFARI)
			return safari.extension.baseURI + file;
		if(IS_CHROME)
			return chrome.runtime.getURL(file);
	};
	
	extension.createTab = function(url) {
		// Safari
		if(IS_SAFARI) {
			if (!url.match(/^http/)) {
				url = safari.extension.baseURI + url;
			}
			var browserWindow = safari.application.activeBrowserWindow;
			if(browserWindow == null)
				browserWindow = safari.application.openBrowserWindow();
			
			browserWindow.openTab().url = url;
		}
		
		// Chrome
		else if(IS_CHROME) {
			chrome.tabs.create({"url":url});
		}
	};
	
	extension.createWindow = function(url) {
		if(IS_SAFARI) {
			if (!url.match(/^http/)) {
				url = safari.extension.baseURI + url;
			}
			
			var browserWindow = safari.application.openBrowserWindow();
			browserWindow.tabs[0].url = url;
		}
		else if(IS_CHROME) {
			chrome.windows.create({url: url, focused: true});
		}
	};
	
	extension.setBadge = function(text) {
		if(IS_SAFARI) {
			var toolbarItems = safari.extension.toolbarItems;
			for(var i = 0; i < toolbarItems.length; i++) {
				if(toolbarItems[i].identifier == "toolbarButton")
					toolbarItems[i].badge = text;
			}
		}
		else if(IS_CHROME) {
			chrome.browserAction.setBadgeBackgroundColor({color:[0, 200, 0, 100]});
			chrome.browserAction.setBadgeText({text:String(text)});
		}
	};
	
	extension.getPopovers = function() {
		var popovers = new Array();
		
		if(IS_SAFARI) {
			$.each(safari.extension.popovers, function(index, popover) {
				popovers.push(popover.contentWindow);
			});
		}
		else if(IS_CHROME) {
			popovers = chrome.extension.getViews({type: 'popup'});
		}
		
		return popovers;
	};
	
	extension.hidePopovers = function() {
		if(IS_SAFARI) {
			var popovers = extension.getSafariPopoverObjects();
			for(var i = 0; i < popovers.length; i++) {
				popovers[i].hide();
			}
		}
		else if(IS_CHROME) {
			var popovers = extension.getPopovers();
			for(var i = 0; i < popovers.length; i++) {
				popovers[i].close();
			}
		}
	};
	
	extension.getSafariPopoverObjects = function() {
		var popovers = new Array();
		
		if(IS_SAFARI) {
			$.each(safari.extension.popovers, function(index, popover) {
				popovers.push(popover);
			});
		}
		
		return popovers;
	};
	
	extension.getSafariPopoverObject = function(identifier) {
		var popovers = extension.getSafariPopoverObjects();
		for(var i = 0; i < popovers.length; i++) {
			if(popovers[i].identifier == identifier)
				return popovers[i];
		}
		return null;
	};
	
	extension.onPopoverVisible = function(eventHandler, identifier) {
		if(IS_SAFARI) {
			safari.application.addEventListener("popover", function(event) {
				if(event.target.identifier == identifier) {
					eventHandler(event);
				}
			}, true);
		}
		else if(IS_CHROME) {
			$(document).ready(eventHandler);
		}
	};
	
	extension.onPopoverHidden = function(eventHandler, identifier) {
		if(IS_SAFARI) {
			safari.application.addEventListener("popover", function(event) {
				if(event.target.identifier == identifier) {
					var safariPopover = extension.getSafariPopoverObject(identifier);
					
					if(safariPopover != null) {
						var popoverVisibilityTimer = setInterval(function() {
							if(safariPopover.visible === false) {
								eventHandler();
								clearInterval(popoverVisibilityTimer);
							}
						}, 1000);
					}
				}
			});
		}
		else if(IS_CHROME) {
			$(window).unload(eventHandler);
		}
	}
	
	extension.getBackgroundPage = function() {
		var backgroundPage;
		
		if(IS_SAFARI) {
			backgroundPage = safari.extension.globalPage.contentWindow;
		}
		else if(IS_CHROME) {
			backgroundPage = chrome.extension.getBackgroundPage();
		}
		
		return backgroundPage;
	};
	
	// !Context menus
	var contextMenuItems = {};
	if(IS_SAFARI && typeof safari.application === "object") {
		safari.application.addEventListener("contextmenu", function(event) {
			for(var id in contextMenuItems)
			{
				if(contextMenuItems.hasOwnProperty(id)) {
					event.contextMenu.appendContextMenuItem(id, contextMenuItems[id].title);	
				}
			}
		}, false);
		
		
		safari.application.addEventListener("validate", function(event) {
			if(contextMenuItems.hasOwnProperty(event.command)) {
				event.target.disabled = false; //!contextMenuItems[event.command].enabled;
			}
		}, false);
		
		safari.application.addEventListener("command", function(event) {
			if(contextMenuItems.hasOwnProperty(event.command) && typeof contextMenuItems[event.command].onclick === "function") {
				contextMenuItems[event.command].onclick(event.userInfo);
			}
		}, false);
	}
	
	extension.createContextMenuItem = function(options) {
		if(contextMenuItems.hasOwnProperty(options.id)) {
			var id = options.id;
			delete options.id;
			extension.updateContextMenuItem(id, options)
		}
		else {
			contextMenuItems[options.id] = options;
			
			if (IS_CHROME) {
				chrome.contextMenus.create(options);
			}
		}
	};
	
	extension.updateContextMenuItem = function(id, newOptions) {
		if(contextMenuItems.hasOwnProperty(id))
		{
			for(var key in newOptions)
			{
				contextMenuItems[id][key] = newOptions[key];
			}
	
			if (IS_CHROME) {
				chrome.contextMenus.update(id, newOptions);
			}
		}
	}
	
	extension.removeContextMenuItem = function(id) {
		if(contextMenuItems.hasOwnProperty(id))
		{
			delete contextMenuItems[id];
			
			if (IS_CHROME) {
				chrome.contextMenus.remove(id);
			}
		}
	}
	
	// !Safari extension update check
	extension.safariCheckForUpdate = function() {
		if(IS_SAFARI) {
			var currentVersion = extension.getExtensionBundleVersion();
			
			$.ajax({
				type: 'GET',
				url: SAFARI_UPDATE_MANIFEST,
				dataType: 'xml'
			}).done(function(data) {
				// Find dictionary for this extension
				$.each($(data).find("key"), function(index, key) {
					if($(key).text() == 'CFBundleIdentifier' && $(key).next().text() == 'nl.luukdobber.safaridownloadstation') {
						var dict = $(key).closest('dict');
						var updateUrl;
						// Find the latest version
						$.each(dict.find("key"), function(index, key){
							if($(key).text() == 'URL') {
								updateUrl = $(key).next().text();
							}
						});
						
						$.each(dict.find("key"), function(index, key){
							if($(key).text() == 'CFBundleVersion') {
								var latestVersion = parseInt($(key).next().text());
								if(currentVersion < latestVersion)
								{
									extension.showNotification(
										"Synology Download Station",
										extension.getLocalizedString("newVersionAvailable"),
										true, updateUrl);
								}
							}
						});
					}
				});
			});
		}
	};
	
	// !Notifications
	extension.showNotification = function(title, text, keepVisible, onclickUrl) {
		var keepVisible = keepVisible || false;
		var onclickUrl = onclickUrl || false;
		var textDirection = (extension.getLocalizedString("textDirection") == "rtl" ? "rtl" : "ltr");
		var icon = "Icon-48.png";
		
		
		if("Notification" in window)
		{
			var notification = new Notification(title, {
				dir: textDirection,
				body: text,
				icon: icon
			});
			
			if(onclickUrl) {
				notification.onclick = function() {
					extension.createWindow(onclickUrl);
					this.close();
				};
			}
			
			if(keepVisible == false) {
				setTimeout(function() {
					notification.close();
				}, 5000);
			}
			return notification;
		}
		
		// Safari 5(?) and Chrome prior v22
		else if(typeof webkitNotifications === "object") {
			var notification = webkitNotifications.createNotification(icon, title, text);
			
			if(onclickUrl) {
				notification.onclick = function() {
					extension.createWindow(onclickUrl);
					this.cancel();
				};
			}
			
			notification.show();
			
			if(keepVisible == false) {
				setTimeout(function() {
					notification.cancel();
				}, 5000);
			}
			return notification;
		}
		return null;
	}
	
	
	// !Message passing
	extension.sendMessageFromContent = function(name, message) {
		var messageData = {
			id: Math.random().toString(36).substring(7),
			name: name,
			message: message
		};
		if(IS_CHROME) {
			if(chrome.runtime && chrome.runtime.sendMessage){
				chrome.runtime.sendMessage(messageData);
			}
			else if(chrome.extension && chrome.extension.sendRequest)
			{
				chrome.extension.sendRequest(messageData);
			}
		}
		if(IS_SAFARI) {
			if(typeof safari.self.tab == "object" && safari.self.tab instanceof SafariContentBrowserTabProxy)
				safari.self.tab.dispatchMessage("extensionMessage", messageData, false);
			else if(safari.application.activeBrowserWindow && safari.application.activeBrowserWindow.activeTab.page instanceof SafariWebPageProxy)
				safari.application.activeBrowserWindow.activeTab.page.dispatchMessage("extensionMessage", messageData, false);
		}
	};
	
	extension.sendMessage = function(name, message) {
		var messageData = {
			id: Math.random().toString(36).substring(7),
			name: name,
			message: message
		};
		if(IS_CHROME) {
			if(chrome.runtime && chrome.runtime.sendMessage)
			{
				chrome.runtime.sendMessage(messageData);
			}
			else if(chrome.extension.sendRequest)
			{
				chrome.extension.sendRequest(messageData);
			}
			
			if(chrome.tabs) {
				chrome.tabs.getSelected(null, function(tab) {
					if(tab && chrome.tabs.sendMessage)
					{
						chrome.tabs.sendMessage(tab.id, messageData);
					}
					else if(tab && chrome.tabs.sendRequest)
					{ //Chrome 25(?) and older
						chrome.tabs.sendRequest(tab.id, messageData);
					}
				});
			}
		}
		if(IS_SAFARI) {
			if(typeof safari.self.tab == "object" && safari.self.tab instanceof SafariContentBrowserTabProxy)
				safari.self.tab.dispatchMessage("extensionMessage", messageData, false);
			else if(safari.application.activeBrowserWindow != null
					&& safari.application.activeBrowserWindow.activeTab.page instanceof SafariWebPageProxy)
				safari.application.activeBrowserWindow.activeTab.page.dispatchMessage("extensionMessage", messageData, false);
		}
	};
	
	extension._receivedMessages = [];
	extension.onMessage = function(callback) {
		if(IS_CHROME) {
			if(chrome.runtime && chrome.runtime.onMessage){
				chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
					if (extension._receivedMessages.indexOf(request.id) == -1) {
						extension._receivedMessages.push(request.id);
						callback.call(extension, { name: request.name, message: request.message });
					}
				});
			}
			else if(chrome.extension.onRequest){
				chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
					if (extension._receivedMessages.indexOf(request.id) == -1) {
						extension._receivedMessages.push(request.id);
						callback.call(extension, { name: request.name, message: request.message });
					}
				});
			}
		}
		if(IS_SAFARI) {
			var eventHandler = function(event) {
				if(event.name === "extensionMessage")
				{
					var request = event.message;
					if (extension._receivedMessages.indexOf(request.id) == -1) {
						extension._receivedMessages.push(request.id);
						callback.call(extension, {name: request.name, message: request.message });
					}
				}
			};
			
			if(typeof safari.application === "object")
				safari.application.addEventListener("message", eventHandler, false);
			else if(typeof safari.self === "object") {
				safari.self.addEventListener("message", eventHandler, false);
			} else {
				console.warn("Could not find safari.application or safari.self to add message event listener.");
			}
		}
	};
})();