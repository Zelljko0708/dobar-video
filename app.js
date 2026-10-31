(() => {
    "use strict";

    const $ = id => document.getElementById(id);

    const videoFile = $("videoFile");
    const video = $("video");
    const previewWrap = $("previewWrap");
    const videoText = $("videoText");
    const caption = $("caption");
    const textSize = $("textSize");
    const textColor = $("textColor");
    const subtitleText = $("subtitleText");
    const subtitlePreview = $("subtitlePreview");
    const musicFile = $("musicFile");
    const exportButton = $("exportButton");

    let videoURL = null;
    let musicURL = null;
    let musicAudio = null;

    let dragging = false;
    let dragDX = 0;
    let dragDY = 0;

    let exportBusy = false;

    let videoGain = null;
    let musicGain = null;
    let audioContext = null;
    let videoSourceNode = null;
    let musicSourceNode = null;

    function setStatus(id, message) {
        $(id).textContent = message;
    }

    function clamp(number, min, max) {
        return Math.max(min, Math.min(max, number));
    }

    function seconds(number) {
        return Number.isFinite(number) ? number.toFixed(1) : "0.0";
    }

    function trimValues() {
        const start = Math.max(0, Number($("trimStart").value) || 0);
        const endRaw = Number($("trimEnd").value);

        const end = Number.isFinite(endRaw) && endRaw > 0
            ? endRaw
            : video.duration;

        return {
            start: clamp(start, 0, video.duration || 0),
            end: clamp(end, 0, video.duration || 0)
        };
    }

    function validTrim() {
        const trim = trimValues();

        if (!(trim.end > trim.start)) {
            setStatus(
                "exportStatus",
                "Greška: vrijeme završetka mora biti veće od početka."
            );

            return false;
        }

        return true;
    }

    // UČITAVANJE VIDEA

    videoFile.addEventListener("change", () => {
        const file = videoFile.files && videoFile.files[0];

        if (!file) return;

        if (videoURL) {
            URL.revokeObjectURL(videoURL);
        }

        videoURL = URL.createObjectURL(file);
        video.src = videoURL;
        video.style.display = "block";

        $("emptyPreview").style.display = "none";

        video.load();

        setStatus("videoStatus", "Učitavam: " + file.name);
        $("downloadLink").hidden = true;
    });

    video.addEventListener("loadedmetadata", () => {
        $("trimStart").value = "0";
        $("trimEnd").value = seconds(video.duration);

        $("trimEnd").max = seconds(video.duration);
        $("trimStart").max = seconds(video.duration);

        $("durationInfo").textContent =
            "Trajanje videa: " + seconds(video.duration) + " sekundi.";

        setStatus(
            "videoStatus",
            "Video je spreman: " +
            video.videoWidth + " × " + video.videoHeight
        );

        exportButton.disabled = false;
    });

    video.addEventListener("error", () => {
        setStatus(
            "videoStatus",
            "Preglednik ne može otvoriti ovaj video format. Probaj MP4."
        );
    });

    // TEKST NA VIDEU

    caption.addEventListener("input", () => {
        videoText.textContent = caption.value;
    });

    textSize.addEventListener("input", () => {
        videoText.style.fontSize = textSize.value + "px";
        $("sizeValue").textContent = textSize.value + " px";
    });

    textColor.addEventListener("input", () => {
        videoText.style.color = textColor.value;
    });

    subtitleText.addEventListener("input", () => {
        subtitlePreview.textContent = subtitleText.value;
    });

    $("resetText").addEventListener("click", () => {
        videoText.style.left = "5%";
        videoText.style.right = "5%";
        videoText.style.top = "8%";
    });

    // POMJERANJE TEKSTA PRSTOM

    videoText.addEventListener("pointerdown", event => {
        if (!caption.value.trim()) return;

        dragging = true;

        const rect = videoText.getBoundingClientRect();

        dragDX = event.clientX - rect.left;
        dragDY = event.clientY - rect.top;

        videoText.setPointerCapture(event.pointerId);
    });

    videoText.addEventListener("pointermove", event => {
        if (!dragging) return;

        const parent = previewWrap.getBoundingClientRect();
        const rect = videoText.getBoundingClientRect();

        const left = clamp(
            event.clientX - parent.left - dragDX,
            0,
            parent.width - rect.width
        );

        const top = clamp(
            event.clientY - parent.top - dragDY,
            0,
            parent.height - rect.height
        );

        videoText.style.left =
            (left / parent.width * 100) + "%";

        videoText.style.right = "auto";

        videoText.style.top =
            (top / parent.height * 100) + "%";
    });

    ["pointerup", "pointercancel"].forEach(type => {
        videoText.addEventListener(type, () => {
            dragging = false;
        });
    });

    // SKRAĆIVANJE VIDEA

    $("resetTrim").addEventListener("click", () => {
        if (!Number.isFinite(video.duration)) return;

        $("trimStart").value = "0";
        $("trimEnd").value = seconds(video.duration);
    });

    $("previewTrim").addEventListener("click", async () => {
        if (!video.src || !validTrim()) return;

        const trim = trimValues();

        video.currentTime = trim.start;

        try {
            await video.play();

            setStatus(
                "exportStatus",
                "Pregled izabranog dijela videa."
            );
        } catch (error) {
            setStatus(
                "exportStatus",
                "Pritisni dugme za reprodukciju na videu."
            );
        }
    });

    video.addEventListener("timeupdate", () => {
        if (!exportBusy && video.paused === false) {
            const trim = trimValues();

            if (video.currentTime >= trim.end) {
                video.pause();
            }
        }
    });

    // DODAVANJE MUZIKE

    musicFile.addEventListener("change", () => {
        const file = musicFile.files && musicFile.files[0];

        if (!file) return;

        if (musicURL) {
            URL.revokeObjectURL(musicURL);
        }

        musicURL = URL.createObjectURL(file);

        if (musicAudio) {
            musicAudio.pause();
            musicAudio.src = "";
        }

        musicAudio = new Audio(musicURL);
        musicAudio.preload = "auto";

        setStatus(
            "musicStatus",
            "Dodana muzika: " + file.name
        );

        $("downloadLink").hidden = true;
    });

    // JAČINA ZVUKA

    $("videoVolume").addEventListener("input", event => {
        $("videoVolumeValue").textContent =
            event.target.value + "%";

        if (videoGain) {
            videoGain.gain.value =
                Number(event.target.value) / 100;
        } else {
            video.volume = Number(event.target.value) / 100;
        }
    });

    $("musicVolume").addEventListener("input", event => {
        $("musicVolumeValue").textContent =
            event.target.value + "%";

        if (musicGain) {
            musicGain.gain.value =
                Number(event.target.value) / 100;
        }

        if (musicAudio && !audioContext) {
            musicAudio.volume =
                Number(event.target.value) / 100;
        }
    });

    // PRIPREMA ZVUKA ZA IZVOZ

    async function prepareAudio() {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return null;

        if (!audioContext) {
            audioContext = new AudioContextClass();

            videoSourceNode =
                audioContext.createMediaElementSource(video);

            videoGain = audioContext.createGain();

            videoSourceNode.connect(videoGain);
            videoGain.connect(audioContext.destination);

            if (musicAudio) {
                musicSourceNode =
                    audioContext.createMediaElementSource(musicAudio);

                musicGain = audioContext.createGain();

                musicSourceNode.connect(musicGain);
                musicGain.connect(audioContext.destination);
            }
        } else if (musicAudio && !musicSourceNode) {
            musicSourceNode =
                audioContext.createMediaElementSource(musicAudio);

            musicGain = audioContext.createGain();

            musicSourceNode.connect(musicGain);
            musicGain.connect(audioContext.destination);
        }

        videoGain.gain.value =
            Number($("videoVolume").value) / 100;

        if (musicGain) {
            musicGain.gain.value =
                Number($("musicVolume").value) / 100;
        }

        await audioContext.resume();

        const destination =
            audioContext.createMediaStreamDestination();

        videoGain.connect(destination);

        if (musicGain) {
            musicGain.connect(destination);
        }

        return destination.stream.getAudioTracks();
    }

    // CRTANJE VIDEA NA PLATNO

    function drawCover(ctx, source, width, height) {
        const sourceWidth = source.videoWidth;
        const sourceHeight = source.videoHeight;

        if (!sourceWidth || !sourceHeight) return;

        const scale = Math.min(
            width / sourceWidth,
            height / sourceHeight
        );

        const drawWidth = sourceWidth * scale;
        const drawHeight = sourceHeight * scale;

        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, width, height);

        ctx.drawImage(
            source,
            (width - drawWidth) / 2,
            (height - drawHeight) / 2,
            drawWidth,
            drawHeight
        );
    }

    function drawWrappedText(
        ctx,
        text,
        x,
        y,
        maxWidth,
        lineHeight
    ) {
        const words = text.split(/\s+/);

        let line = "";
        let currentY = y;

        for (const word of words) {
            const test = line
                ? line + " " + word
                : word;

            if (
                ctx.measureText(test).width > maxWidth &&
                line
            ) {
                ctx.fillText(line, x, currentY);

                line = word;
                currentY += lineHeight;
            } else {
                line = test;
            }
        }

        if (line) {
            ctx.fillText(line, x, currentY);
        }
    }

    // IZVOZ VIDEA

    exportButton.addEventListener("click", async () => {
        if (exportBusy) return;

        if (!video.src || !Number.isFinite(video.duration)) {
            setStatus("exportStatus", "Prvo izaberi video.");
            return;
        }

        if (!validTrim()) return;

        if (
            !window.MediaRecorder ||
            !HTMLCanvasElement.prototype.captureStream
        ) {
            setStatus(
                "exportStatus",
                "Ovaj preglednik ne podržava izvoz. Probaj najnoviji Chrome na Androidu."
            );

            return;
        }

        const trim = trimValues();

        const canvas = document.createElement("canvas");

        const scale = Math.min(
            1,
            1280 / video.videoWidth,
            1280 / video.videoHeight
        );

        canvas.width = Math.max(
            2,
            Math.round(video.videoWidth * scale)
        );

        canvas.height = Math.max(
            2,
            Math.round(video.videoHeight * scale)
        );

        const ctx = canvas.getContext("2d");
        const stream = canvas.captureStream(30);

        let audioTracks = [];

        const oldTime = video.currentTime;
        const wasMuted = video.muted;

        exportBusy = true;
        exportButton.disabled = true;

        $("downloadLink").hidden = true;
        $("progressBar").style.width = "0%";

        setStatus(
            "exportStatus",
            "Pripremam izvoz... Ne zatvaraj ovu stranicu."
        );

        let recorder;
        let chunks = [];
        let animationFrame = 0;

        try {
            try {
                audioTracks = await prepareAudio() || [];
            } catch (error) {
                audioTracks = [];
            }

            audioTracks.forEach(track => {
                stream.addTrack(track);
            });

            const mimeCandidates = [
                "video/webm;codecs=vp9,opus",
                "video/webm;codecs=vp8,opus",
                "video/webm"
            ];

            const mimeType = mimeCandidates.find(type =>
                MediaRecorder.isTypeSupported(type)
            );

            recorder = new MediaRecorder(
                stream,
                mimeType ? { mimeType } : undefined
            );

            recorder.ondataavailable = event => {
                if (event.data && event.data.size) {
                    chunks.push(event.data);
                }
            };

            const stopped = new Promise((resolve, reject) => {
                recorder.onstop = resolve;

                recorder.onerror = () => {
                    reject(new Error("Snimanje nije uspjelo."));
                };
            });

            recorder.start(500);

            video.pause();
            video.muted = false;
            video.currentTime = trim.start;

            await new Promise((resolve, reject) => {
                if (
                    Math.abs(video.currentTime - trim.start) < 0.05 &&
                    video.readyState >= 2
                ) {
                    resolve();
                } else {
                    const timeout = setTimeout(() => {
                        reject(
                            new Error("Video se nije mogao pripremiti.")
                        );
                    }, 10000);

                    video.addEventListener("seeked", () => {
                        clearTimeout(timeout);
                        resolve();
                    }, { once: true });
                }
            });

            if (musicAudio) {
                musicAudio.currentTime = 0;
                musicAudio.pause();
            }

            await video.play();

            if (musicAudio) {
                try {
                    await musicAudio.play();
                } catch (error) {
                    // Izvoz može nastaviti i bez muzike.
                }
            }

            const fontScale =
                canvas.width / previewWrap.clientWidth;

            const render = () => {
                drawCover(
                    ctx,
                    video,
                    canvas.width,
                    canvas.height
                );

                // GLAVNI TEKST

                if (caption.value.trim()) {
                    const left =
                        parseFloat(videoText.style.left) || 5;

                    const top =
                        parseFloat(videoText.style.top) || 8;

                    const x = videoText.style.left.endsWith("%")
                        ? canvas.width * left / 100
                        : canvas.width * left / previewWrap.clientWidth;

                    const y = videoText.style.top.endsWith("%")
                        ? canvas.height * top / 100
                        : canvas.height * top / previewWrap.clientHeight;

                    const size = Math.max(
                        14,
                        parseFloat(
                            getComputedStyle(videoText).fontSize
                        ) * fontScale
                    );

                    ctx.font = "bold " + size + "px Arial";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "top";

                    ctx.fillStyle = textColor.value;
                    ctx.strokeStyle = "#000";
                    ctx.lineWidth = Math.max(2, size * 0.12);

                    ctx.shadowColor = "#000";
                    ctx.shadowBlur = size * 0.18;

                    drawWrappedText(
                        ctx,
                        caption.value,
                        x + (videoText.offsetWidth * fontScale / 2),
                        y,
                        canvas.width * 0.9,
                        size * 1.2
                    );

                    ctx.shadowBlur = 0;
                }

                // PODNASLOV

                if (subtitleText.value.trim()) {
                    const size = Math.max(
                        18,
                        canvas.width * 0.035
                    );

                    ctx.font = "bold " + size + "px Arial";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "bottom";

                    ctx.fillStyle = "#fff";
                    ctx.strokeStyle = "#000";
                    ctx.lineWidth = Math.max(3, size * 0.12);

                    const lines = subtitleText.value.split("\n");

                    lines.slice(-3).forEach((line, index) => {
                        const y =
                            canvas.height - size * (1.2 - index * 1.15);

                        ctx.strokeText(
                            line,
                            canvas.width / 2,
                            y,
                            canvas.width * 0.9
                        );

                        ctx.fillText(
                            line,
                            canvas.width / 2,
                            y,
                            canvas.width * 0.9
                        );
                    });
                }

                // NAPREDAK IZVOZA

                const percent = clamp(
                    (video.currentTime - trim.start) /
                    (trim.end - trim.start) * 100,
                    0,
                    100
                );

                $("progressBar").style.width = percent + "%";

                if (
                    video.currentTime >= trim.end ||
                    video.ended
                ) {
                    video.pause();

                    if (musicAudio) {
                        musicAudio.pause();
                    }

                    if (recorder.state !== "inactive") {
                        recorder.stop();
                    }

                    return;
                }

                animationFrame = requestAnimationFrame(render);
            };

            render();

            await new Promise(resolve => {
                const check = () => {
                    if (recorder.state === "inactive") {
                        resolve();
                    } else {
                        setTimeout(check, 150);
                    }
                };

                check();
            });

            await stopped;

            cancelAnimationFrame(animationFrame);

            const blob = new Blob(chunks, {
                type: recorder.mimeType || "video/webm"
            });

            if (!blob.size) {
                throw new Error("Izvoz je napravio praznu datoteku.");
            }

            const resultURL = URL.createObjectURL(blob);

            const link = $("downloadLink");

            link.href = resultURL;
            link.download = "moj-video.webm";
            link.hidden = false;

            link.textContent =
                "⬇ Preuzmi gotov video (" +
                (blob.size / 1024 / 1024).toFixed(1) +
                " MB)";

            setStatus(
                "exportStatus",
                "Gotovo! Video je spreman za preuzimanje."
            );

            $("progressBar").style.width = "100%";

        } catch (error) {
            cancelAnimationFrame(animationFrame);

            if (recorder && recorder.state !== "inactive") {
                recorder.stop();
            }

            setStatus(
                "exportStatus",
                "Izvoz nije uspio: " +
                error.message +
                " Probaj kraći video."
            );

        } finally {
            video.pause();

            if (musicAudio) {
                musicAudio.pause();
            }

            video.muted = wasMuted;

            if (Number.isFinite(oldTime)) {
                video.currentTime = oldTime;
            }

            stream.getTracks().forEach(track => track.stop());

            audioTracks.forEach(track => track.stop());

            exportBusy = false;
            exportButton.disabled = false;
        }
    });

    // POČETNE VRIJEDNOSTI

    $("videoVolumeValue").textContent =
        $("videoVolume").value + "%";

    $("musicVolumeValue").textContent =
        $("musicVolume").value + "%";

})();
