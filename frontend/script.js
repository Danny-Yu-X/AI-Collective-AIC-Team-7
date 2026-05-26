async function predictStock() {

    // Hide result box and show loading
    document.getElementById("result").classList.add("hidden");
    document.getElementById("loading").classList.remove("hidden");

    // Gather data from inputs and new dropdowns
    const data = {
        symbol: document.getElementById("stock-symbol").value,
        horizon: document.getElementById("time-horizon").value,
        open: parseFloat(document.getElementById("open").value),
        high: parseFloat(document.getElementById("high").value),
        low: parseFloat(document.getElementById("low").value),
        close: parseFloat(document.getElementById("close").value),
        volume: parseFloat(document.getElementById("volume").value)
    };

    // Basic validation to ensure the user selected the dropdowns
    if (!data.symbol || !data.horizon || isNaN(data.open)) {
        alert("Please fill out all fields.");
        document.getElementById("loading").classList.add("hidden");
        return;
    }

    try {

        const response = await fetch("http://127.0.0.1:5000/predict", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        // Hide loading, show results
        document.getElementById("loading").classList.add("hidden");
        document.getElementById("result").classList.remove("hidden");

        // Update UI with response
        document.getElementById("prediction").innerText =
            `Prediction: ${result.prediction}`;

        document.getElementById("confidence").innerText =
            `Confidence: ${result.confidence}%`;

    } catch (error) {
        console.error(error);
        document.getElementById("loading").classList.add("hidden");
        alert("Error connecting to backend. Make sure your Flask server is running!");
    }
}