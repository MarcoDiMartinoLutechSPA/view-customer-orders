sap.ui.define([], function() {
    "use strict";

    return {
        formatDate: function(date) {
            var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern: "dd/MM/yyyy"});
            return oDateFormat.format(date);
        },

        formatDateString: function(dateString)
        {
            // Analizzare la stringa in un oggetto Data
            var dateObject = new Date(dateString);

            // Estrarre i componenti della data
            var year = dateObject.getFullYear();
            var month = String(dateObject.getMonth() + 1).padStart(2, '0'); // I mesi sono basati su 0, quindi aggiungere 1 e riempire con zero se necessario
            var day = String(dateObject.getDate()).padStart(2, '0'); // riempire con zero se necessario

            // Costruire come stringa la data formattata
            var formattedDateString = year + '-' + month + '-' + day;

            var date = new Date(formattedDateString);
            var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern: "dd/MM/yyyy"});
            return oDateFormat.format(date);
        },
    };
});