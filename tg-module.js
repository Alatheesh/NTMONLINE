/**
 * Telegram Automated Fetcher - Shared Modular Engine
 * Integrates Version 2 automation into add.html and edit.html
 */

window.TelegramModule = {
    discoveredItems: [],
    onImportCallback: null,

    // 1. Inject UI layouts directly into the host page's container container
    init: function(containerId, onImportSuccess) {
        const container = document.getElementById(containerId);
        if (!container) return console.error(`TelegramModule Error: Container #${containerId} not found.`);
        
        this.onImportCallback = onImportSuccess;

        // Render standard template layout matching your admin dashboard UI
        container.innerHTML = `
            <div style="background: #0d1b2a; padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #00bfff;">
                <h3 style="color: #00bfff; margin-top: 0; display: flex; justify-content: space-between; align-items: center; font-size:16px;">
                    🔑 Telegram Configuration Panel
                    <button onclick="TelegramModule.toggleConfig()" style="background:none; border:none; color:#00bfff; cursor:pointer; font-size:13px;">[Show/Hide Options]</button>
                </h3>
                <div id="tgModConfigFields" style="display: none; grid-template-columns: 1fr 1fr; gap: 10px; margin-top:15px;">
                    <div>
                        <label style="color:#aaa; font-size:12px; font-weight:bold;">API ID</label>
                        <input type="number" id="tgModApiId" style="width:95%; padding:8px; margin-top:5px; background:#1b263b; color:#fff; border:1px solid #333; border-radius:4px;">
                    </div>
                    <div>
                        <label style="color:#aaa; font-size:12px; font-weight:bold;">API HASH</label>
                        <input type="text" id="tgModApiHash" style="width:95%; padding:8px; margin-top:5px; background:#1b263b; color:#fff; border:1px solid #333; border-radius:4px;">
                    </div>
                    <div style="grid-column: span 2;">
                        <label style="color:#aaa; font-size:12px; font-weight:bold;">PERMANENT USER SESSION STRING</label>
                        <input type="text" id="tgModSession" placeholder="Paste session generated from tg-test.html" style="width:97%; padding:8px; margin-top:5px; background:#1b263b; color:#fff; border:1px solid #333; border-radius:4px;">
                    </div>
                    <div style="grid-column: span 2;">
                        <label style="color:#aaa; font-size:12px; font-weight:bold;">PRIVATE CHANNEL ID</label>
                        <input type="text" id="tgModChannelId" placeholder="-100xxxxxxxxx" style="width:97%; padding:8px; margin-top:5px; background:#1b263b; color:#fff; border:1px solid #333; border-radius:4px;">
                    </div>
                    <div style="grid-column: span 2; text-align: right; margin-top: 5px;">
                        <button onclick="TelegramModule.saveCredentials()" style="padding: 8px 16px; background:#00bfff; color:#000; border:none; font-weight:bold; border-radius:4px; cursor:pointer; font-size:13px;">Save Credentials</button>
                    </div>
                </div>
            </div>

            <div style="background: rgba(0, 191, 255, 0.03); padding: 20px; border-radius: 10px; border: 1px solid rgba(0, 191, 255, 0.2);">
                <h3 style="color: #00bfff; margin-top: 0; font-size:16px;">🎬 Automated Search Scan</h3>
                <div style="display: flex; gap: 10px; margin-top:10px;">
                    <input type="text" id="tgModSearchQuery" placeholder="Enter Movie or Series Target Title..." style="padding: 12px; flex-grow: 1; background: #0a1128; color: #fff; border: 1px solid #00bfff; border-radius: 5px;">
                    <button onclick="TelegramModule.executeScan()" style="padding: 12px 20px; background: #00bfff; color: #000; border: none; font-weight: bold; border-radius: 5px; cursor: pointer;">Fetch Data</button>
                </div>
                
                <div id="tgModStatusStatus" style="margin-top: 15px; font-size: 14px; color: #ffdf00; font-weight:bold;"></div>
                
                <div id="tgModVerificationWrapper" style="margin-top: 20px; display: none;">
                    <h4 style="color:#fff; border-bottom:1px solid #223366; padding-bottom:8px; margin-bottom:10px; font-size:14px;">Verify & Select Extracted Stream Injects</h4>
                    <div id="tgModResultsGrid" style="display:flex; flex-direction:column; gap:10px; max-height:350px; overflow-y:auto; padding-right:5px;"></div>
                    <div style="margin-top:15px; text-align:right;">
                        <button onclick="TelegramModule.compilePayloadAndImport()" style="padding: 10px 20px; background: #32cd32; color: #fff; border: none; font-weight: bold; border-radius: 5px; cursor: pointer;">Confirm & Import to Form</button>
                    </div>
                </div>
            </div>
        `;

        // Load credentials from storage array variables instantly
        document.getElementById("tgModApiId").value = localStorage.getItem("ntm_api_id") || "";
        document.getElementById("tgModApiHash").value = localStorage.getItem("ntm_api_hash") || "";
        document.getElementById("tgModSession").value = localStorage.getItem("ntm_bot_session_str") || "";
        document.getElementById("tgModChannelId").value = localStorage.getItem("ntm_channel_id") || "";
        
        if (!localStorage.getItem("ntm_api_id")) this.toggleConfig();
    },

    toggleConfig: function() {
        const target = document.getElementById("tgModConfigFields");
        target.style.display = target.style.display === "none" ? "grid" : "none";
    },

    saveCredentials: function() {
        localStorage.setItem("ntm_api_id", document.getElementById("tgModApiId").value.trim());
        localStorage.setItem("ntm_api_hash", document.getElementById("tgModApiHash").value.trim());
        localStorage.setItem("ntm_bot_session_str", document.getElementById("tgModSession").value.trim());
        localStorage.setItem("ntm_channel_id", document.getElementById("tgModChannelId").value.trim());
        alert("Credentials catalog updated successfully inside local storage profile parameters!");
        this.toggleConfig();
    },

    // 2. Core Search implementation linking straight into window level GramJS components
    executeScan: function() {
        const query = document.getElementById("tgModSearchQuery").value.trim();
        const status = document.getElementById("tgModStatusStatus");
        const verificationArea = document.getElementById("tgModVerificationWrapper");
        const grid = document.getElementById("tgModResultsGrid");

        this.discoveredItems = [];
        grid.innerHTML = "";
        verificationArea.style.display = "none";

        if (typeof telegram === "undefined") {
            return alert("Critical Error: telegram.js file script dependency missing from header paths.");
        }

        const apiId = parseInt(localStorage.getItem("ntm_api_id"));
        const apiHash = localStorage.getItem("ntm_api_hash");
        const savedSession = localStorage.getItem("ntm_bot_session_str");
        const channelId = localStorage.getItem("ntm_channel_id");

        if (!apiId || !apiHash || !savedSession || !channelId) {
            status.innerHTML = "❌ Configuration profile incomplete. Check credential data blocks above.";
            this.toggleConfig();
            return;
        }
        if (!query) return alert("Please clarify standard media title before initializing scan routing operations.");

        status.innerHTML = "⏳ Direct link connection routing initialization process active...";

        (async () => {
            try {
                const { TelegramClient } = telegram;
                const { StringSession } = telegram.sessions;

                const client = new TelegramClient(new StringSession(savedSession), apiId, apiHash, { connectionRetries: 3 });
                await client.start({});

                status.innerHTML = `🔍 Connected as Account User! Pulling catalog matching "${query}"...`;

                const messages = await client.getMessages(channelId, { search: query, limit: 25 });

                for (const msg of messages) {
                    let fileInfo = null;

                    if (msg.media && msg.media.document) {
                        let doc = msg.media.document;
                        let sizeText = doc.size > 1073741824 
                            ? (doc.size / 1073741824).toFixed(2) + " GB" 
                            : (doc.size / 1048576).toFixed(2) + " MB";

                        let fileName = "Stream_Target_Component.mp4";
                        let durationText = "N/A";

                        for (const attr of doc.attributes) {
                            if (attr.className === "DocumentAttributeFilename") fileName = attr.fileName;
                            if (attr.className === "DocumentAttributeVideo") {
                                durationText = Math.floor((attr.duration || 0) / 60) + " mins";
                            }
                        }

                        let episodeMatch = fileName.match(/(?:e|ep|episode)[-_\s]*0*(\d+)/i);
                        let detectedEpisode = episodeMatch ? `Ep ${episodeMatch[1]}` : null;

                        fileInfo = { name: fileName, size: sizeText, duration: durationText, episode: detectedEpisode };
                    }

                    if (msg.replyMarkup && msg.replyMarkup.rows) {
                        msg.replyMarkup.rows.forEach(row => {
                            row.buttons.forEach(btn => {
                                const btnTextNormalized = btn.text.toLowerCase();
                                if (btn.url && btnTextNormalized.includes("download") && !btn.url.includes("t.me/")) {
                                    this.discoveredItems.push({
                                        id: msg.id,
                                        label: btn.text,
                                        url: btn.url,
                                        file: fileInfo
                                    });
                                }
                            });
                        });
                    }
                }

                if (this.discoveredItems.length === 0) {
                    status.innerHTML = `❌ Search execution halted: 0 valid records matching text "${query}" detected.`;
                    await client.disconnect();
                    return;
                }

                status.innerHTML = `✅ Parsed <b>${this.discoveredItems.length}</b> matches safely. Choose data inputs to retain:`;

                this.discoveredItems.forEach((item, index) => {
                    let titleMeta = item.file ? item.file.name : `Link Component Record #${index + 1}`;
                    let badgeHtml = item.file && item.file.episode ? `<span style="background:#ff4500; color:#fff; padding:2px 6px; border-radius:3px; font-size:11px; margin-right:5px; font-weight:bold;">${item.file.episode}</span>` : "";
                    let fileDataHtml = item.file ? `<div style="color:#aaa; font-size:12px; margin-top:2px;">💾 Size metrics: ${item.file.size} | ⏳ Active duration: ${item.file.duration}</div>` : "";

                    grid.innerHTML += `
                        <div style="background: #111a36; border: 1px solid #223366; padding: 12px; border-radius: 6px; display: flex; align-items: center; gap: 12px;">
                            <input type="checkbox" id="tgModChk_${index}" checked style="transform: scale(1.3); cursor:pointer;">
                            <div style="flex-grow: 1;">
                                <div style="color:#fff; font-weight:bold; font-size:13px; word-break:break-all;">${badgeHtml}${titleMeta}</div>
                                ${fileDataHtml}
                                <div style="font-size:11px; color:#00bfff; margin-top:2px; opacity:0.8;">🔗 Link Target: ${item.url.substring(0, 50)}...</div>
                            </div>
                        </div>
                    `;
                });

                verificationArea.style.display = "block";
                await client.disconnect();

            } catch (err) {
                console.error(err);
                status.innerHTML = `❌ System operational crash: ${err.message}`;
            }
        })();
    },

    // 3. Compile selected parameters, turn them to Base64 format and hand them over to host callback
    compilePayloadAndImport: function() {
        let selectedPayloadList = [];

        this.discoveredItems.forEach((item, index) => {
            const checkbox = document.getElementById(`tgModChk_${index}`);
            if (checkbox && checkbox.checked) {
                selectedPayloadList.push({
                    episode: item.file && item.file.episode ? item.file.episode : "",
                    size: item.file ? item.file.size.split(" ")[0] : "",
                    unit: item.file && item.file.size.includes("GB") ? "GB" : "MB",
                    quality: "1080p", // Standard Default
                    url: btoa(item.url) // Instant clean Base64 layout packaging
                });
            }
        });

        if (selectedPayloadList.length === 0) return alert("Please retain at least one checklist field parameters.");

        // Deliver array straight back to add.html or edit.html implementation structures
        if (typeof this.onImportCallback === "function") {
            this.onImportCallback(selectedPayloadList);
            alert(`🎉 Success: Loaded ${selectedPayloadList.length} stream links directly into your active form list structure components!`);
        }
    }
};
