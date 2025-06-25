export const utils = (() => { // Exportăm un obiect numit 'utils'
    /**
     * Obține locația curentă a utilizatorului folosind Geolocation API din browser.
     * @returns {Promise<Object>} Un obiect cu latitudinea și longitudinea.
     */
    function getUserLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation is not supported by your browser."));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude,
                    });
                },
                (error) => {
                    let errorMessage = "Unable to retrieve your location.";
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = "Locația este blocată. Vă rugăm să permiteți accesul la locație în setările browserului.";
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = "Informațiile despre locație nu sunt disponibile.";
                            break;
                        case error.TIMEOUT:
                            errorMessage = "Timpul pentru obținerea locației a expirat.";
                            break;
                        case error.UNKNOWN_ERROR:
                            errorMessage = "A apărut o eroare necunoscută la obținerea locației.";
                            break;
                    }
                    reject(new Error(errorMessage));
                }
            );
        });
    }

    return {
        getUserLocation, // Exportăm funcția în interiorul obiectului 'utils'
    };
})();
