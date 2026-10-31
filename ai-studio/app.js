(() => {
  "use strict";

  const $ = id => document.getElementById(id);

  const canvas = $("stage");
  if (!canvas) {
    alert("Greška: Nije pronađeno platno za video. Provjeri index.html.");
    return;
  }

  const ctx = canvas.getContext("2d");

  const idea = $("idea");
  const genre = $("genre");
  const duration = $("duration");
  const scriptBox = $("script");
  const titleBox = $("title");
  const sceneList = $("sceneList");
  const status = $("status");
  const createBtn = $("createBtn");
  const previewBtn = $("previewBtn");
  const stopBtn = $("stopBtn");
  const exportBtn = $("exportBtn");
  const progressBar = $("progressBar");
  const download = $("download");

  let scenes = [];
  let currentScene = 0;
  let playing = false;
  let animationTimer = null;
  let recorder = null;
  let recordedChunks = [];
  let audioContext = null;

  const W = 720;
  const H = 1280;
  canvas.width = W;
  canvas.height = H;

  const examples = {
    humor: [
      {
        speaker: "Mujo",
        text: "Doktore, imam problem. Svaki put kad popijem kafu, boli me oko!",
        bg: "#243b55"
      },
      {
        speaker: "Doktor",
        text: "A jeste li probali izvaditi kašičicu iz šolje?",
        bg: "#385170"
      },
      {
        speaker: "Mujo",
        text: "Doktore, vi ste genije! Koliko sam vam dužan?",
        bg: "#293e56"
      },
      {
        speaker: "Doktor",
        text: "Ništa. Samo nemojte više piti kašičice!",
        bg: "#18324b"
      }
    ],
    bosna: [
      {
        speaker: "Komšija",
        text: "Jesi li počeo da treniraš?",
        bg: "#294d36"
      },
      {
        speaker: "Mujo",
        text: "Jesam, svaki dan!",
        bg: "#315e42"
      },
      {
        speaker: "Komšija",
        text: "I kakvi su rezultati?",
        bg: "#426b4b"
      },
      {
        speaker: "Mujo",
        text: "Odlično! Sad se umorim čim pomislim na trening!",
        bg: "#254a34"
      }
    ],
    motivation: [
      {
        speaker: "Glas",
        text: "Ne moraš danas biti najbolji.",
        bg: "#24335d"
      },
      {
        speaker: "Glas",
        text: "Dovoljno je da ne odustaneš.",
        bg: "#344b78"
      },
      {
        speaker: "Glas",
        text: "Svaki veliki put počinje malim korakom.",
        bg: "#263c69"
      },
      {
        speaker: "Glas",
        text: "Samo nastavi. Tvoja priča još traje!",
        bg: "#1b2b50"
      }
    ],
    story: [
      {
        speaker: "Pripovjedač",
        text: "Jednog jutra, Mujo je pronašao misterioznu kutiju.",
        bg: "#493b66"
      },
      {
        speaker: "Mujo",
        text: "Šta li se krije unutra?",
        bg: "#574477"
      },
      {
        speaker: "Pripovjedač",
        text: "Otvorio je kutiju i ugledao poruku.",
        bg: "#674c83"
      },
      {
        speaker: "Mujo",
        text: "Piše: Ne otvaraj ovu kutiju!",
        bg: "#43345c"
      }
    ]
  };

  function setStatus(message) {
    if (status) status.textContent = message;
  }

  function makeScenes() {
    const selected = genre ? genre.value : "humor";
    const prompt = idea ? idea.value.trim() : "";
    let source = examples[selected] || examples.humor;

    if (prompt) {
      source = [
        {
          speaker: "Lik 1",
          text: prompt,
          bg: "#243b55"
        },
        {
          speaker: "Lik 2",
          text: "Čekaj malo, šta si upravo rekao?",
          bg: "#385170"
        },
        {
          speaker: "Lik 1",
          text: "Pa upravo ono što si čuo!",
          bg: "#293e56"
        },
        {
          speaker: "Lik 2",
          text: "E, ovo će se još dugo prepričavati!",
          bg: "#18324b"
        }
      ];
    }

    scenes = source.map((s, i) => ({
      ...s,
      number: i + 1
    }));

    currentScene = 0;

    if (titleBox) {
      titleBox.value = prompt ? prompt.slice(0, 55) : "Balkanska priča";
    }

    if (scriptBox) {
      scriptBox.value = scenes
        .map(s => s.speaker + ": " + s.text)
        .join("\n\n");
    }

    renderSceneList();renderSceneList();
$("storyPanel").hidden = false;
$("previewPanel").hidden = false;
drawScene(0);
    drawScene(0);
    setStatus("Video je napravljen! Sada možeš pokrenuti pregled.");
  }

  function renderSceneList() {
    if (!sceneList) return;

    sceneList.innerHTML = "";

    scenes.forEach((scene, index) => {
      const item = document.createElement("div");
      item.className = "scene";
      item.textContent =
        "Scena " + (index + 1) + " — " +
        scene.speaker + ": " + scene.text;

      item.addEventListener("click", () => {
        stopPreview();
        currentScene = index;
        drawScene(index);
        setStatus("Prikazana scena " + (index + 1));
      });

      sceneList.appendChild(item);
    });
  }

  function roundedRect(x, y, w, h, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
  }

  function drawCharacter(x, y, color, name, flip = false) {
    ctx.save();
    if (flip) {
      ctx.translate(x * 2, 0);
      ctx.scale(-1, 1);
    }

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 95, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f3c9a5";
    ctx.beginPath();
    ctx.arc(x, y - 20, 63, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#30251e";
    ctx.beginPath();
    ctx.arc(x - 23, y - 35, 8, 0, Math.PI * 2);
    ctx.arc(x + 23, y - 35, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#603b32";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(x, y + 4, 23, 0.15, Math.PI - 0.15);
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 30px Arial";
    ctx.textAlign = "center";
    ctx.fillText(name, x, y + 135);

    ctx.restore();
  }

  function drawScene(index) {
    if (!scenes.length) {
      ctx.fillStyle = "#18243a";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.font = "bold 42px Arial";
      ctx.fillText("DOBAR VIDEO", W / 2, H / 2);
      ctx.font = "28px Arial";
      ctx.fillText("Pritisni Napravi video", W / 2, H / 2 + 60);
      return;
    }

    const scene = scenes[index];

    ctx.fillStyle = scene.bg;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.arc(i * 110, 180 + (i % 2) * 100, 55, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "bold 42px Arial";
    ctx.fillText(titleBox && titleBox.value ? titleBox.value : "DOBAR VIDEO", W / 2, 105);

    drawCharacter(225, 480, "#e6a23c", "MUJO");
    drawCharacter(495, 480, "#4b9cce", "HASO", true);

    roundedRect(45, 760, 630, 285, 28, "#ffffff");

    ctx.fillStyle = "#172033";
    ctx.textAlign = "center";
    ctx.font = "bold 35px Arial";
    ctx.fillText(scene.speaker, W / 2, 820);

    ctx.font = "31px Arial";
    const words = scene.text.split(" ");
    let line = "";
    let y = 890;

    words.forEach(word => {
      const test = line + word + " ";
      if (ctx.measureText(test).width > 550 && line) {
        ctx.fillText(line.trim(), W / 2, y);
        line = word + " ";
        y += 48;
      } else {
        line = test;
      }
    });

    if (line) ctx.fillText(line.trim(), W / 2, y);

    ctx.fillStyle = "#ffffff";
    ctx.font = "26px Arial";
    ctx.fillText(
      "SCENA " + (index + 1) + " / " + scenes.length,
      W / 2,
      1170
    );

    ctx.font = "bold 30px Arial";
    ctx.fillText("DOBAR VIDEO – AI STUDIO", W / 2, 1230);
  }

  function speak(text) {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "sr-RS";
    utterance.rate = 0.92;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
  }

  function stopPreview() {
    playing = false;
    clearTimeout(animationTimer);

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    if (previewBtn) previewBtn.disabled = false;
    setStatus("Pregled je zaustavljen.");
  }

  function playPreview() {
    if (!scenes.length) {
      makeScenes();
    }

    stopPreview();
    playing = true;
    currentScene = 0;

    if (previewBtn) previewBtn.disabled = true;

    function next() {
      if (!playing) return;

      const scene = scenes[currentScene];
      drawScene(currentScene);

      const voiceOn = $("voiceOn");
      if (!voiceOn || voiceOn.checked) {
        speak(scene.speaker + ". " + scene.text);
      }

      setStatus("Pregled scene " + (currentScene + 1));

      currentScene++;

      if (currentScene >= scenes.length) {
        animationTimer = setTimeout(() => {
          stopPreview();
          currentScene = 0;
          drawScene(0);
          setStatus("Pregled je završen.");
        }, 4500);
      } else {
        animationTimer = setTimeout(next, 4500);
      }
    }

    next();
  }

  function createTone() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    audioContext = new AudioCtx();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 110;
    gain.gain.value = 0.025;

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();

    return {
      stop: () => {
        try {
          oscillator.stop();
          audioContext.close();
        } catch (e) {}
      }
    };
  }

  async function exportVideo() {
    if (!scenes.length) makeScenes();

    if (!canvas.captureStream || !window.MediaRecorder) {
      setStatus("Ovaj preglednik ne podržava izvoz videa.");
      return;
    }

    stopPreview();

    const stream = canvas.captureStream(25);
    recordedChunks = [];

    let tone = null;
    const musicOn = $("musicOn");

    if (musicOn && musicOn.checked) {
      tone = createTone();
    }

    let options = {};
    if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
      options.mimeType = "video/webm;codecs=vp9";
    } else if (MediaRecorder.isTypeSupported("video/webm")) {
      options.mimeType = "video/webm";
    }

    try {
      recorder = new MediaRecorder(stream, options);
    } catch (error) {
      setStatus("Ne mogu pokrenuti izvoz na ovom uređaju.");
      if (tone) tone.stop();
      return;
    }

    recorder.ondataavailable = event => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      if (tone) tone.stop();

      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);

      if (download) {
        download.href = url;
        download.download = "dobar-video.webm";
        download.textContent = "Preuzmi gotov video";
        download.style.display = "inline-block";
      }

      setStatus("Video je spreman! Pritisni Preuzmi gotov video.");
      if (progressBar) progressBar.style.width = "100%";
    };

    recorder.start();

    let index = 0;
    const total = scenes.length;

    function recordNext() {
      drawScene(index);

      if (progressBar) {
        progressBar.style.width =
          Math.round(((index + 1) / total) * 100) + "%";
      }

      index++;

      if (index < total) {
        setTimeout(recordNext, 3500);
      } else {
        setTimeout(() => {
          if (recorder && recorder.state !== "inactive") {
            recorder.stop();
          }
        }, 3500);
      }
    }

    setStatus("Izvoz videa je u toku...");
    recordNext();
  }

  if (createBtn) {
    createBtn.addEventListener("click", event => {
      event.preventDefault();
      try {
        makeScenes();
      } catch (error) {
        console.error(error);
        setStatus("Greška pri pravljenju videa. Osvježi stranicu.");
      }
    });
  }

  if (previewBtn) {
    previewBtn.addEventListener("click", event => {
      event.preventDefault();
      playPreview();
    });
  }

  if (stopBtn) {
    stopBtn.addEventListener("click", event => {
      event.preventDefault();
      stopPreview();
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", event => {
      event.preventDefault();
      exportVideo();
    });
  }

  drawScene(0);
  setStatus("Spreman za pravljenje videa. Unesi ideju i pritisni dugme!");

})();
