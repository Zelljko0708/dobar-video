
const videoFile = document.getElementById("videoFile");
const video = document.getElementById("video");
const caption = document.getElementById("caption");
const videoContainer = document.getElementById("videoContainer");

const videoText = document.createElement("div");
videoText.id = "videoText";
videoContainer.appendChild(videoText);

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
