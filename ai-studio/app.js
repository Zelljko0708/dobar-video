
(() => {
  "use strict";

  const $ = id => document.getElementById(id);

  const el = {
    idea: $("idea"),
    genre: $("genre"),
    duration: $("duration"),
    format: $("format"),
    voice: $("voice"),
    create: $("createBtn"),
    regenerate: $("regenerateBtn"),
    storyPanel: $("storyPanel"),
    title: $("title"),
    script: $("script"),
    sceneList: $("sceneList"),
    previewPanel: $("previewPanel"),
    status: $("status"),
    stage: $("stage"),
    preview: $("previewBtn"),
    stop: $("stopBtn"),
    captions: $("captions"),
    voiceOn: $("voiceOn"),
    musicOn: $("musicOn"),
    export: $("exportBtn"),
    progress: $("progressBar"),
    exportMessage: $("exportMessage"),
    download: $("download")
  };

  let scenes = [];
  let currentScene = 0;
  let timer = null;
  let recorder = null;
  let chunks = [];
  let stream = null;
  let recording = false;
  let speech = null;

  const examples = {
    humor: [
      ["Mujo", "Doktore, imam problem. Svaki put kad popijem kafu, boli me oko."],
      ["Doktor", "A jeste li probali izvaditi kašičicu iz šolje?"],
      ["Mujo", "Nisam, doktore. Mislio sam da je nešto ozbiljno!"]
    ],
    balkan: [
      ["Haso", "Mujo, jesi li čuo da je gorivo opet poskupjelo?"],
      ["Mujo", "Jesam. Zato sam danas išao pješke."],
      ["Haso", "Pametno!"],
      ["Mujo", "Samo što sam morao pješke vratiti i auto iz servisa."]
    ],
    motivacija: [
      ["Pripovjedač", "Nije važno koliko puta padneš."],
      ["Pripovjedač", "Važno je da svaki put pronađeš razlog da ustaneš."],
      ["Pripovjedač", "Mali koraci danas mogu promijeniti tvoj sutrašnji dan."]
    ],
    price: [
      ["Pripovjedač", "Jednog jutra, čovjek je pronašao staru poruku."],
      ["Čovjek", "Na njoj je pisalo: Ne zaboravi šta te čini sretnim."],
      ["Pripovjedač", "Tog dana odlučio je ponovo nazvati starog prijatelja."]
    ]
  };

  function setStatus(message) {
    if (el.status) el.status.textContent = message;
  }

  function makeScenes() {
    const genre = el.genre?.value || "humor";
    const idea = el.idea?.value.trim() || "";
    const duration = Number(el.duration?.value || 30);

    const source = examples[genre] || examples.humor;
    const count = Math.max(3, Math.min(source.length, Math.round(duration / 8)));

    scenes = source.slice(0, count).map((item, index) => ({
      number: index + 1,
      speaker: item[0],
      text: item[1],
      duration: duration / count
    }));

    if (idea) {
      scenes[0].text = idea + " " + scenes[0].text;
    }

    currentScene = 0;

    if (el.title) {
      el.title.value = idea || "Nova humoristična priča";
    }

    if (el.script) {
      el.script.value = scenes
        .map(scene => scene.speaker + ": " + scene.text)
        .join("\n\n");
    }

    renderSceneList();

    if (el.storyPanel) el.storyPanel.hidden = false;
    if (el.previewPanel) el.previewPanel.hidden = false;

    drawScene(0);
    setStatus("Scenario je spreman. Možeš pregledati scene.");
  }

  function renderSceneList() {
    if (!el.sceneList) return;

    el.sceneList.innerHTML = "";

    scenes.forEach((scene, index) => {
      const item = document.createElement("div");
      item.className = "scene";

      const heading = document.createElement("strong");
      heading.textContent = "Scena " + scene.number + " — " + scene.speaker;

      const paragraph = document.createElement("p");
      paragraph.textContent = scene.text;

      item.appendChild(heading);
      item.appendChild(paragraph);

      item.addEventListener("click", () => {
        currentScene = index;
        drawScene(index);
      });

      el.sceneList.appendChild(item);
    });
  }

  function drawScene(index) {
    const canvas = el.stage;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const format = el.format?.value || "portrait";

    if (format === "landscape") {
      canvas.width = 640;
      canvas.height = 360;
    } else if (format === "square") {
      canvas.width = 480;
      canvas.height = 480;
    } else {
      canvas.width = 360;
      canvas.height = 640;
    }

    const scene = scenes[index];
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = "#17243b";
    ctx.fillRect(0, 0, w, h);

    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, "#283d65");
    gradient.addColorStop(1, "#101522");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "#8ea7ff";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.fillText("DOBAR VIDEO", w / 2, 55);

    if (!scene) return;

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px Arial";
    ctx.fillText(scene.speaker, w / 2, h * 0.35);

    if (el.captions?.checked !== false) {
      drawWrappedText(ctx, scene.text, w / 2, h * 0.52, w * 0.78, 32);
    }

    ctx.fillStyle = "#9eafff";
    ctx.font = "16px Arial";
    ctx.fillText("Scena " + (index + 1) + " / " + scenes.length, w / 2, h - 35);
  }

  function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "";
    let lines = [];

    words.forEach(word => {
      const test = line ? line + " " + word : word;

      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });

    if (line) lines.push(line);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";

    const startY = y - ((lines.length - 1) * lineHeight) / 2;

    lines.forEach((part, index) => {
      ctx.fillText(part, x, startY + index * lineHeight, maxWidth);
    });
  }

  function stopSpeech() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  function speakScene(scene) {
    if (!el.voiceOn?.checked || !("speechSynthesis" in window)) return;

    stopSpeech();

    speech = new SpeechSynthesisUtterance(
      scene.speaker + ". " + scene.text
    );

    speech.lang = "sr-RS";

    const choice = el.voice?.value || "auto";
    const voices = window.speechSynthesis.getVoices();

    const localVoices = voices.filter(voice =>
      /sr|hr|bs|me/i.test(voice.lang)
    );

    if (localVoices.length) {
      speech.voice = localVoices[0];
    }

    if (choice === "female") speech.pitch = 1.25;
    if (choice === "male") speech.pitch = 0.85;

    speech.rate = 0.95;
    window.speechSynthesis.speak(speech);
  }

  function playPreview() {
    if (!scenes.length) {
      setStatus("Prvo napravi scenario.");
      return;
    }

    stopPreview();
    recording = true;
    currentScene = 0;
    showNextScene();
  }

  function showNextScene() {
    if (!recording || currentScene >= scenes.length) {
      stopPreview();
      return;
    }

    const scene = scenes[currentScene];

    drawScene(currentScene);
    speakScene(scene);

    timer = setTimeout(() => {
      currentScene++;
      showNextScene();
    }, scene.duration * 1000);
  }

  function stopPreview() {
    recording = false;
    clearTimeout(timer);
    stopSpeech();
    setStatus("Pregled je zaustavljen.");
  }

  async function exportVideo() {
    if (!scenes.length) {
      setStatus("Prvo napravi scenario.");
      return;
    }

    const canvas = el.stage;

    if (!canvas || !canvas.captureStream || !window.MediaRecorder) {
      setStatus("Ovaj preglednik ne podržava izvoz videa.");
      return;
    }

    stopPreview();
    chunks = [];

    stream = canvas.captureStream(24);

    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";

    try {
      recorder = new MediaRecorder(stream, { mimeType: mime });
    } catch (error) {
      setStatus("Telefon ne podržava ovaj način izvoza.");
      return;
    }

    recorder.ondataavailable = event => {
      if (event.data && event.data.size > 0) chunks.push(event.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);

      if (el.download) {
        el.download.href = url;
        el.download.download = "dobar-video.webm";
        el.download.textContent = "Preuzmi video";
        el.download.hidden = false;
      }

      if (el.exportMessage) {
        el.exportMessage.textContent =
          "Video je spreman za preuzimanje. Format: WebM.";
      }

      if (el.progress) el.progress.style.width = "100%";

      stream.getTracks().forEach(track => track.stop());
      setStatus("Izvoz je završen.");
    };

    recorder.start();

    if (el.progress) el.progress.style.width = "0%";
    if (el.exportMessage) {
      el.exportMessage.textContent = "Video se priprema...";
    }

    let index = 0;

    function recordNext() {
      if (index >= scenes.length) {
        recorder.stop();
        return;
      }

      drawScene(index);

      const progress = ((index + 1) / scenes.length) * 100;
      if (el.progress) el.progress.style.width = progress + "%";

      index++;

      setTimeout(recordNext, scenes[index - 1].duration * 1000);
    }

    recordNext();
  }

  if (el.create) {
    el.create.addEventListener("click", makeScenes);
  }

  if (el.regenerate) {
    el.regenerate.addEventListener("click", makeScenes);
  }

  if (el.preview) {
    el.preview.addEventListener("click", playPreview);
  }

  if (el.stop) {
    el.stop.addEventListener("click", stopPreview);
  }

  if (el.export) {
    el.export.addEventListener("click", exportVideo);
  }

  setStatus("Studio je spreman. Unesi ideju i pritisni Napravi scenario.");
})();

