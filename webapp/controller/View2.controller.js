sap.ui.define([
    "sap/btp/viewcustomerorders/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/m/MessageBox",
    "sap/ui/export/Spreadsheet",
    "sap/ui/export/library",
    "sap/ui/model/Sorter",
    "../utils/DateFormatter"
],

function (BaseController, JSONModel, ODataModel, MessageBox, Spreadsheet, exportLibrary, Sorter, DateFormatter) {
    "use strict";

    const EdmType = exportLibrary.EdmType;
    const url_oData = "/V2/Northwind/Northwind.svc/";

    return BaseController.extend("sap.btp.viewcustomerorders.controller.View2", {

        dateFormatter: DateFormatter,

        onInit: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("RouteView2").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function(oEvent) {
            var sCustomerId = oEvent.getParameter("arguments").customerId;
            var oView = this.getView();

            // Carica i dettagli del cliente e gli ordini in parallelo
            Promise.all([
                this._loadCustomerDetails(sCustomerId),
                this._loadCustomerOrders(sCustomerId)
            ]).then(function(aResults) {
                var oCustomerDetails = aResults[0];
                var oCustomerOrders = aResults[1];

                // Aggiungi CompanyName, Country e DeliveryStatus a ogni ordine
                var aOrders = oCustomerOrders.results.map(function(oOrder) {
                    oOrder.CompanyName = oCustomerDetails.CompanyName;
                    oOrder.Country = oCustomerDetails.Country;
                    oOrder.DeliveryStatus = this._calculateDeliveryStatus(oOrder);
                    oOrder.DeliveryStatusState = this._getDeliveryStatusState(oOrder.DeliveryStatus);
                    return oOrder;
                }.bind(this));

                // Imposta il modello combinato sulla vista
                var oCustomerOrdersModel = new JSONModel({ results: aOrders });
                oView.setModel(oCustomerOrdersModel, "customerOrdersModel");

                // Imposta anche il modello dei dettagli del cliente sulla vista (se necessario)
                var oCustomerDetailsModel = new JSONModel(oCustomerDetails);
                oView.setModel(oCustomerDetailsModel, "customerDetailsModel");

            }.bind(this)).catch(function(oError) {
                console.error("Error loading data:", oError);
            });
        },

        _loadCustomerDetails: function(sCustomerId) {
            var oModel = new ODataModel(url_oData);
            var sPath = "/Customers('" + sCustomerId + "')";
        
            return new Promise(function(resolve, reject) {
                oModel.read(sPath, {
                    success: function(oData) {
                        resolve(oData);
                    },
                    error: function(oError) {
                        MessageBox.error("Error fetching customer data: " + oError.message);
                        reject(oError);
                    }
                });
            });
        },

        _loadCustomerOrders: function(sCustomerId) {
            var oModel = new ODataModel(url_oData);
            var sPath = "/Customers('" + sCustomerId + "')/Orders";
        
            return new Promise(function(resolve, reject) {
                oModel.read(sPath, {
                    success: function(oData) {
                        resolve(oData);
                    },
                    error: function(oError) {
                        MessageBox.error("Error fetching customer orders: " + oError.message);
                        reject(oError);
                    }
                });
            });
        },

        _calculateDeliveryStatus: function(oOrder) {
            const TODAY = new Date("1996-07-27");
            const SHIPPING_DAYS = {
                "Germany": 4,
                "Mexico": 12,
                "Sweden": 6,
                "France": 4,
                "Spain": 6,
                "Canada": 15,
                "Argentina": 18,
                "Switzerland": 3,
                "Brazil": 19,
                "UK": 5,
                "Austria": 3
            };

            var oShippedDate = oOrder.ShippedDate ? new Date(oOrder.ShippedDate) : null;
            var oRequiredDate = new Date(oOrder.RequiredDate);
            var sCountry = oOrder.Country;
            var iShippingDays = SHIPPING_DAYS[sCountry] || 0;
            var oExpectedDeliveryDate = new Date(oShippedDate);
            oExpectedDeliveryDate.setDate(oExpectedDeliveryDate.getDate() + iShippingDays);

            if (oShippedDate == null) {
                return "In Progress";
            } else if (TODAY > oRequiredDate && TODAY <= oExpectedDeliveryDate) {
                return "In Ritardo";
            } else if (TODAY > oExpectedDeliveryDate) {
                return "Consegnato";
            } else {
                return "In Progress";
            }
        },

        _getDeliveryStatusState: function(sStatus) {
            switch (sStatus) {
                case "Consegnato":
                    return "Success";
                case "In Ritardo":
                    return "Error";
                case "In Progress":
                    return "Information";
                default:
                    return "None";
            }
        },

        onSortOrderID: function() { this._sortColumn("OrderID"); },
        onSortOrderDate: function() { this._sortColumn("OrderDate"); },
        onSortShippedDate: function() { this._sortColumn("ShippedDate"); },
        onSortRequiredDate: function() { this._sortColumn("RequiredDate"); },
        
        _sortColumn: function (sSortProperty) {
            var oTable = this.byId("customerOrdersTable");
            var oBinding = oTable.getBinding("items");
            var aSorters = [];
        
            // Determina se l'ordinamento corrente è discendente e deve essere invertito
            var bDescending = false;
            if (oBinding.aSorters.length > 0 && oBinding.aSorters[0].sPath === sSortProperty) {
                bDescending = !oBinding.aSorters[0].bDescending;
            }
        
            // Crea un nuovo sorter per la proprietà selezionata
            var oSorter = new Sorter(sSortProperty, bDescending);
            aSorters.push(oSorter);
        
            // Applica solo il sorter per la proprietà selezionata
            oBinding.sort(aSorters);
        },

        createColumnConfig: function() {
            return [
                {
                    label: "{i18n>columnOrderID}",
                    property: "OrderID",
                    type: EdmType.String
                },
                {
                    label: "{i18n>columnShipCity}",
                    property: "ShipCity",
                    type: EdmType.String
                },
                {
                    label: "{i18n>columnOrderDate}",
                    property: "OrderDate",
                    type: EdmType.Date,
                    format: "dd/MM/yyyy"
                },
                {
                    label: "{i18n>columnShippedDate}",
                    property: "ShippedDate",
                    type: EdmType.Date,
                    format: "dd/MM/yyyy"
                },
                {
                    label: "{i18n>columnRequiredDate}",
                    property: "RequiredDate",
                    type: EdmType.Date,
                    format: "dd/MM/yyyy"
                },
                {
                    label: "{i18n>columnCustomerID}",
                    property: "CustomerID",
                    type: EdmType.String
                },
                {
                    label: "{i18n>columnCompanyName}",
                    property: "CompanyName",
                    type: EdmType.String
                },
                {
                    label: "{i18n>columnCountry}",
                    property: "Country",
                    type: EdmType.String
                },
                {
                    label: "{i18n>columnDeliveryStatus}",
                    property: "DeliveryStatus",
                    type: EdmType.String
                }
            ];
        },

        onExport: function() {
            var aCols, oRowBinding, oSettings, oSheet, oTable;
        
            if (!this._oTable) {
                this._oTable = this.byId('customerOrdersTable');
            }
        
            oTable = this._oTable;
            oRowBinding = oTable.getBinding('items').oList; 
            aCols = this.createColumnConfig();
        
            // Mantieni le date come oggetti Date
            var aFormattedData = oRowBinding.map(function(oRow) {
                oRow.OrderDate = oRow.OrderDate ? new Date(oRow.OrderDate) : null;
                oRow.ShippedDate = oRow.ShippedDate ? new Date(oRow.ShippedDate) : null;
                oRow.RequiredDate = oRow.RequiredDate ? new Date(oRow.RequiredDate) : null;
                return oRow;
            });
        
            oSettings = {
                workbook: {
                    columns: aCols,
                    hierarchyLevel: 'Level'
                },
                dataSource: aFormattedData,
                fileName: 'Table export sample.xlsx',
                worker: false 
            };
        
            oSheet = new Spreadsheet(oSettings);
            oSheet.build().finally(function() {
                oSheet.destroy();
            });
        }
    });
});
