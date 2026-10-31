const videoFile = document.getElementById("videoFile");
const video = document.getElementById("video");
const caption = document.getElementById("caption");
const videoText = document.getElementById("videoText");
const textSize = document.getElementById("textSize");

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
