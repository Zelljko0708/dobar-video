const videoFile = document.getElementById("videoFile");
const video = document.getElementById("video");
const caption = document.getElementById("caption");
const videoText = document.getElementById("videoText");
const textSize = document.getElementById("textSize");
const textColor = document.getElementById("textColor");
const videoContainer = document.getElementById("videoContainer");
const resetText = document.getElementById("resetText");

// Učitavanje videa
videoFile.addEventListener("change", function () {
    const file = this.files[0];

    if (file) {
        video.src = URL.createObjectURL(file);
        video.style.display = "block";
        video.load();
    }
});

// Dodavanje teksta
caption.addEventListener("input", function () {
    videoText.textContent = caption.value;
});

// Promjena veličine teksta
textSize.addEventListener("input", function () {
    videoText.style.fontSize = textSize.value + "px";
});

// Promjena boje teksta
textColor.addEventListener("input", function () {
    videoText.style.color = textColor.value;
});

// Pomjeranje teksta prstom
let isDragging = false;
let offsetX = 0;
let offsetY = 0;

videoText.addEventListener("pointerdown", function (event) {
    if (!caption.value) return;

    isDragging = true;

    const textRect = videoText.getBoundingClientRect();

    offsetX = event.clientX - textRect.left;
    offsetY = event.clientY - textRect.top;

    videoText.setPointerCapture(event.pointerId);
});

videoText.addEventListener("pointermove", function (event) {
    if (!isDragging) return;

    const rect = videoContainer.getBoundingClientRect();
    const textRect = videoText.getBoundingClientRect();

    let left = event.clientX - rect.left - offsetX;
    let top = event.clientY - rect.top - offsetY;

    left = Math.max(0, Math.min(left, rect.width - textRect.width));
    top = Math.max(0, Math.min(top, rect.height - textRect.height));

    videoText.style.left = left + "px";
    videoText.style.top = top + "px";
    videoText.style.right = "auto";
});

videoText.addEventListener("pointerup", function () {
    isDragging = false;
});

videoText.addEventListener("pointercancel", function () {
    isDragging = false;
});

// Vraćanje teksta na početni položaj
resetText.addEventListener("click", function () {
    videoText.style.left = "5%";
    videoText.style.right = "5%";
    videoText.style.top = "25px";
});
