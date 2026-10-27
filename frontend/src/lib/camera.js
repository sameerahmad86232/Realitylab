export function stopCamera(stream) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function cameraErrorMessage(error) {
  if (
    ["NotAllowedError", "PermissionDeniedError", "SecurityError"].includes(
      error?.name,
    )
  )
    return "Camera access was denied. Allow camera access in your browser, or use a photo from your device.";
  if (["NotFoundError", "DevicesNotFoundError"].includes(error?.name))
    return "No camera was found. Connect a camera or choose a photo from your device.";
  if (["NotReadableError", "TrackStartError"].includes(error?.name))
    return "The camera is busy or unavailable. Close other camera apps and try again.";
  return "The camera could not start. Try again or choose a photo from your device.";
}

export async function captureVideoFrame(video) {
  if (!video?.videoWidth || !video.videoHeight || video.readyState < 2)
    throw Error("Wait until the camera preview is ready.");
  const scale = Math.min(
    1,
    1600 / Math.max(video.videoWidth, video.videoHeight),
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
  canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
  const context = canvas.getContext("2d");
  if (!context)
    throw Error(
      "This browser could not capture a photo. Choose a photo from your device instead.",
    );
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.88),
  );
  if (!blob) throw Error("The photo could not be captured. Try again.");
  return new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" });
}
