const videoFile = document.getElementById("videoFile");
const video = document.getElementById("video");
const caption = document.getElementById("caption");
const videoText = document.getElementById("videoText");
const textSize = document.getElementById("textSize");
const textColor = document.getElementById("textColor");

videoFile.addEventListener("change", function () {
    const file = this.files[0];

    if (file) {
        video.src = URL.createObjectURL(file);
        video.style.display = "block";
        video.load();
    }
});

caption.addEventListener("input", function () {
    videoText.textContent = caption.value;
});

textSize.addEventListener("input", function () {
    videoText.style.fontSize = textSize.value + "px";
});

textColor.addEventListener("input", function () {
    videoText.style.color = textColor.value;
});
let isDragging = false;

videoText.addEventListener("pointerdown", function (event) {
    isDragging = true;
    videoText.setPointerCapture(event.pointerId);
});

videoText.addEventListener("pointermove", function (event) {
    if (!isDragging) return;

    const rect = video.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const left = Math.max(0, Math.min(95, (x / rect.width) * 100));
    const top = Math.max(0, Math.min(95, (y / rect.height) * 100));

    videoText.style.left = left + "%";
    videoText.style.top = top + "%";
    videoText.style.right = "auto";
});

videoText.addEventListener("pointerup", function () {
    isDragging = false;
});

videoText.addEventListener("pointercancel", function () {
    isDragging = false;
});
