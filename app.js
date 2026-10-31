const videoFile = document.getElementById("videoFile");
const video = document.getElementById("video");
const caption = document.getElementById("caption");

videoFile.addEventListener("change", function() {
    const file = this.files[0];

    if (file) {
        video.src = URL.createObjectURL(file);
        video.style.display = "block";
    }
});

caption.addEventListener("input", function() {
    let text = document.getElementById("videoText");

    if (!text) {
        text = document.createElement("div");
        text.id = "videoText";
        video.parentElement.appendChild(text);
    }

    text.textContent = caption.value;
});
