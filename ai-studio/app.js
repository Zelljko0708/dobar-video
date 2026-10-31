const $ = id => document.getElementById(id);
const canvas = $("stage");
const ctx = canvas.getContext("2d");

let scenes = [];
let currentScene = 0;
let playing = false;
let playTimer = null;
let generatedTitle = "";

function hashText(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function makeStory() {
  const idea = $("idea").value.trim() || "Jedan neobičan dan";
  const genre = $("genre").value;
  const seconds = Number($("duration").value);
  const seed = hashText(idea);
  const doctor = /doktor|ljekar|bolnica/i.test(idea);

  generatedTitle = idea.length > 42
    ? idea.slice(0, 39) + "..."
    : idea;

  let lines;

  if (genre === "humor" && doctor) {
    lines = [
      ["Čekaonica", "Pacijent ulazi kod doktora. Doktor ozbiljno gleda nalaze.", "Doktor", "Danas imam jednu dobru i jednu lošu vijest."],
      ["Loša vijest", "Pacijent se namršti i nagne naprijed.", "Pacijent", "Dajte prvo lošu, doktore."],
      ["Obrt", "Doktor skida naočale i uzdahne.", "Doktor", "Ostalo vam je još 24 sata života."],
      ["Poenta", "Pacijent skoči sa stolice.", "Pacijent", "A koja je onda dobra vijest?!"],
      ["Završnica", "Doktor pogleda u sat i slegne ramenima.", "Doktor", "Pa... juče sam vas pokušao nazvati!"]
    ];
  } else if (genre === "humor") {
    lines = [
      ["Početak", "U malom mjestu svi imaju savjet za svakoga.", "Pripovjedač", "Kod nas svaki problem ima stručnjaka."],
      ["Savjet", "Komšija prilazi kao da ima rješenje za sve.", "Komšija", "Ja ti kažem, samo treba malo pameti."],
      ["Pitanje", "Drugi ga pogleda potpuno zbunjeno.", "Drugi", "A gdje da je nabavim?"],
      ["Obrt", "Komšija se zamisli pa odgovori.", "Komšija", "E, to već moraš sam istražiti!"]
    ];
  } else if (genre === "balkan") {
    lines = [
      ["Jutro", "Počinje još jedan običan dan na Balkanu.", "Pripovjedač", "Plan je bio da danas sve završim na vrijeme."],
      ["Neočekivano", "Telefon zazvoni baš kad treba krenuti.", "Telefon", "Samo da te pitam nešto, imaš li minut?"],
      ["Haos", "Minut se pretvori u čitav razgovor.", "Pripovjedač", "Na Balkanu minut traje najmanje pola sata."],
      ["Kraj", "Sat pokazuje da je dan već odmakao.", "Pripovjedač", "Dobro, sutra počinjem ispočetka."]
    ];
  } else if (genre === "motivacija") {
    lines = [
      ["Početak", "Svaki veliki korak počinje malom odlukom.", "Pripovjedač", "Ne moraš danas riješiti sve."],
      ["Korak", "Važno je da ne odustaneš od sebe.", "Pripovjedač", "Uradi jednu malu stvar koja te vodi naprijed."],
      ["Snaga", "Greške nisu kraj puta.", "Pripovjedač", "Odmori ako moraš, ali nastavi kad budeš spreman."],
      ["Poruka", "Pogled je usmjeren naprijed.", "Pripovjedač", "Tvoj tempo je tvoj. Samo nastavi."]
    ];
  } else {
    lines = [
      ["Uvod", "Jedna sasvim obična situacija kreće neočekivanim putem.", "Pripovjedač", idea + "."],
      ["Susret", "Dva lika zastanu i razmijene pogled.", "Prvi lik", "Nisam očekivao da će se ovo danas desiti."],
      ["Razgovor", "Drugi lik se nasmije i odgovori.", "Drugi lik", "Ponekad baš takve stvari pamtimo."],
      ["Završetak", "Scena se smiruje i pojavljuje se završna poruka.", "Pripovjedač", "I tako je nastala priča za pamćenje."]
    ];
  }

  if (seconds === 20) lines = lines.slice(0, 4);

  if (seconds === 45 && lines.length < 5) {
    lines.push(["Završna misao", "Kamera se polako udaljava.", "Pripovjedač", "Nastavak slijedi..."]);
  }

  scenes = lines.map((x, i) => ({
    title: x[0],
    visual: x[1],
    speaker: x[2],
    text: x[3],
    color: (seed + i * 73) % 360,
    duration: Math.max(4, seconds / lines.length)
  }));

  $("title").value = generatedTitle;
  $("script").value = scenes.map(s => `${s.speaker}: ${s.text}`).join("\n");

  renderSceneList();
  $("storyPanel").hidden = false;
  $("previewPanel").hidden = false;

  currentScene = 0;
  drawScene(0);
  $("status").textContent = "Scenarij spreman";
}

function renderSceneList() {
  $("sceneList").innerHTML = "";

  scenes.forEach((s, i) => {
    const d = document.createElement("div");
    d.className = "scene";

    const b = document.createElement("b");
    b.textContent = `SCENA ${i + 1} · ${s.title}`;

    const p = document.createElement("p");
    p.textContent = s.visual;

    d.append(b, p);
    $("sceneList").append(d);
  });
}

function readScript() {
  const raw = $("script").value
    .split("\n")
    .map(x => x.trim())
    .filter(Boolean);

  raw.forEach((line, i) => {
    const idx = line.indexOf(":");

    if (idx > 0 && scenes[i]) {
      scenes[i].speaker = line.slice(0, idx).trim();
      scenes[i].text = line.slice(idx + 1).trim();
    }
  });
}

function drawScene(index) {
  if (!scenes.length) return;

  currentScene = Math.max(0, Math.min(index, scenes.length - 1));

  const s = scenes[currentScene];
  const w = canvas.width;
  const h = canvas.height;
  const hue = s.color;

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, `hsl(${hue},48%,25%)`);
  grad.addColorStop(1, `hsl(${(hue + 65) % 360},55%,11%)`);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "rgba(255,255,255,.06)";
  ctx.beginPath();
  ctx.arc(w * .5, h * .24, 150, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#dce4ff";
  ctx.font = "bold 15px system-ui";
  ctx.textAlign = "left";
  ctx.fillText(`SCENA ${index + 1}/${scenes.length}`, 24, 38);

  const bounce = playing ? Math.sin(Date.now() / 220) * 5 : 0;

  drawPerson(w * .32, h * .48 + bounce, "#f3c89d", hue);
  drawPerson(w * .68, h * .48 - bounce, "#d8a77f", (hue + 110) % 360);

  ctx.fillStyle = "rgba(8,12,24,.55)";
  roundRect(18, h * .68, w - 36, h * .25, 18);
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.font = "bold 21px system-ui";
  wrapText(s.title, w / 2, h * .73, w - 60, 26, 2);

  ctx.font = "16px system-ui";
  ctx.fillStyle = "#dbe2f7";
  wrapText(s.visual, w / 2, h * .79, w - 58, 22, 3);

  if ($("captions").checked) {
    ctx.fillStyle = "rgba(0,0,0,.72)";
    roundRect(15, h - 112, w - 30, 82, 12);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.font = "bold 21px system-ui";
    wrapText(s.text, w / 2, h - 82, w - 52, 26, 2);
  }

  ctx.fillStyle = "#b9c7ff";
  ctx.font = "bold 13px system-ui";
  ctx.fillText($("title").value || generatedTitle, w / 2, h - 18);
}

function drawPerson(x, y, skin, hue) {
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = `hsl(${hue},55%,58%)`;
  roundRect(-43, 35, 86, 112, 26);
  ctx.fill();

  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(0, 0, 39, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#252b38";
  ctx.beginPath();
  ctx.arc(-14, -5, 4, 0, Math.PI * 2);
  ctx.arc(14, -5, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#713f3a";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 9, 13, .15, Math.PI - .15);
  ctx.stroke();

  ctx.restore();
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function wrapText(text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const words = String(text).split(/\s+/);
  let line = "";
  let lines = [];

  for (const word of words) {
    const test = line ? line + " " + word : word;

    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }

  if (line) lines.push(line);

  lines = lines.slice(0, maxLines);

  lines.forEach((l, i) => {
    ctx.fillText(l, x, y + i * lineHeight);
  });
}

function speakScene(s) {
  if (!$("voiceOn").checked || !("speechSynthesis" in window)) return;

  speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(`${s.speaker}. ${s.text}`);
  u.lang = "sr-RS";
  u.rate = 0.94;

  const voices = speechSynthesis.getVoices();
  const candidates = voices.filter(v =>
    /sr|hr|bs|ba|me/i.test(v.lang + " " + v.name)
  );

  if (candidates.length) {
    u.voice = candidates[0];
  }

  speechSynthesis.speak(u);
}

function stopPreview() {
  playing = false;
  clearTimeout(playTimer);

  if ("speechSynthesis" in window) {
    speechSynthesis.cancel();
  }

  drawScene(currentScene);
  $("status").textContent = "Zaustavljeno";
}

function previewNext() {
  if (!playing) return;

  if (currentScene >= scenes.length) {
    stopPreview();
    return;
  }

  const s = scenes[currentScene];

  drawScene(currentScene);
  speakScene(s);

  $("status").textContent = `Scena ${currentScene + 1} od ${scenes.length}`;

  playTimer = setTimeout(() => {
    currentScene++;
    previewNext();
  }, s.duration * 1000);
}

function startPreview() {
  if (!scenes.length) return;

  stopPreview();
  playing = true;
  currentScene = 0;
  previewNext();
}

function setFormat() {
  const f = $("format").value;

  if (f === "square") {
    canvas.width = 600;
    canvas.height = 600;
  } else if (f === "landscape") {
    canvas.width = 960;
    canvas.height = 540;
  } else {
    canvas.width = 360;
    canvas.height = 640;
  }

  drawScene(currentScene);
}

function makeMusic(audioContext, destination) {
  if (!$("musicOn").checked) return null;

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.type = "sine";
  osc.frequency.value = 110;
  gain.gain.value = 0.025;

  osc.connect(gain);
  gain.connect(destination);
  osc.start();

  return osc;
}

async function exportVideo() {
  if (!scenes.length) return;

  stopPreview();
  readScript();
  setFormat();

  if (!canvas.captureStream || !window.MediaRecorder) {
    $("exportMessage").textContent =
      "Ovaj preglednik ne podržava snimanje videa. Probaj noviji Chrome.";
    return;
  }

  const stream = canvas.captureStream(30);
  let audioContext = null;
  let oscillator = null;

  try {
    if ($("musicOn").checked && window.AudioContext) {
      audioContext = new AudioContext();

      const destination = audioContext.createMediaStreamDestination();
      oscillator = makeMusic(audioContext, destination);

      destination.stream.getAudioTracks().forEach(track => {
        stream.addTrack(track);
      });
    }

    const mime = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm"
    ].find(type => MediaRecorder.isTypeSupported(type));

    const recorder = new MediaRecorder(
      stream,
      mime ? { mimeType: mime } : undefined
    );

    const chunks = [];

    recorder.ondataavailable = event => {
      if (event.data.size) chunks.push(event.data);
    };

    const stopped = new Promise(resolve => {
      recorder.onstop = resolve;
    });

    recorder.start(250);

    $("exportBtn").disabled = true;
    $("exportMessage").textContent = "Izvoz u toku…";
    $("progressBar").style.width = "0%";

    const total = scenes.reduce((n, s) => n + s.duration, 0);
    const start = Date.now();

    for (let i = 0; i < scenes.length; i++) {
      const s = scenes[i];
      const began = Date.now();

      drawScene(i);

      if ($("voiceOn").checked && "speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(`${s.speaker}. ${s.text}`);
        u.lang = "sr-RS";
        u.rate = 0.94;

        const voices = speechSynthesis.getVoices();
        const voice = voices.find(v =>
          /sr|hr|bs|ba|me/i.test(v.lang + " " + v.name)
        );

        if (voice) u.voice = voice;

        speechSynthesis.speak(u);
      }

      while (Date.now() - began < s.duration * 1000) {
        const progress = Math.min(
          100,
          ((Date.now() - start) / 1000) / total * 100
        );

        $("progressBar").style.width = progress + "%";

        await new Promise(resolve => setTimeout(resolve, 80));
      }
    }

    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();
    }

    recorder.stop();
    await stopped;

    const blob = new Blob(chunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);

    const link = $("download");
    link.href = url;
    link.download = "dobar-video.webm";
    link.hidden = false;
    link.textContent = "⬇ Preuzmi gotov video";

    $("progressBar").style.width = "100%";
    $("exportMessage").textContent =
      "Gotovo! Video je spreman za preuzimanje.";

  } catch (error) {
    $("exportMessage").textContent =
      "Izvoz nije uspio: " + error.message;
  } finally {
    $("exportBtn").disabled = false;

    if (oscillator) {
      try { oscillator.stop(); } catch (e) {}
    }

    if (audioContext) {
      try { await audioContext.close(); } catch (e) {}
    }

    stream.getTracks().forEach(track => track.stop());
  }
}

$("createBtn").addEventListener("click", makeStory);
$("regenerateBtn").addEventListener("click", makeStory);
$("previewBtn").addEventListener("click", startPreview);
$("stopBtn").addEventListener("click", stopPreview);
$("exportBtn").addEventListener("click", exportVideo);

$("captions").addEventListener("change", () => {
  drawScene(currentScene);
});

$("title").addEventListener("input", () => {
  drawScene(currentScene);
});

$("format").addEventListener("change", setFormat);

$("script").addEventListener("input", () => {
  readScript();
  drawScene(currentScene);
});

if ("speechSynthesis" in window) {
  speechSynthesis.getVoices();
}

makeStory();
