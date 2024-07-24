sap.ui.define([
    "sap/btp/viewcustomerorders/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
],
function (BaseController, JSONModel, ODataModel, MessageBox, Filter, FilterOperator) {
    "use strict";

    const url_oData = "/V2/Northwind/Northwind.svc/";

    return BaseController.extend("sap.btp.viewcustomerorders.controller.View1", {
        onInit: function () {
            this.loadCustomers();
        },

        loadCustomers: function() {
            var oModel = new ODataModel(url_oData);

            this.fetchDataFromOData("Customers", oModel, null, null)
            .then(function(oData) {
                var oCustomersModel = new JSONModel(oData);
                this.getView().setModel(oCustomersModel, "customersTableModel");
            }.bind(this))
            .catch(function(oError) {
                MessageBox.error("Error fetching customer data: " + oError.message);
            });
        },

        onSelectionChange: function(oEvent) {
            var oSelectedItem = oEvent.getParameter("listItem");
            this._selectedCustomer = oSelectedItem.getBindingContext("customersTableModel").getObject();
        },

        onPressViewDetails: function() {
            if (!this._selectedCustomer) {
                MessageBox.error("Please select a customer first.");
                return;
            }

            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("RouteView2", {
                customerId: this._selectedCustomer.CustomerID
            });
        },

        onSearch: function(oEvent) {
            var aFilters = [];
            var oTable = this.getView().byId("customersTable");
            var oBinding = oTable.getBinding("items");

            var sQueryCustomerId = this.getView().byId("inputCustomerID").getValue();
            var sQueryCompanyName = this.getView().byId("inputCompanyName").getValue();
            var sQueryCity = this.getView().byId("inputCity").getValue();
            var sQueryFax = this.getView().byId("inputFax").getValue();

            if (sQueryCustomerId) {
                aFilters.push(new Filter("CustomerID", FilterOperator.Contains, sQueryCustomerId));
            }
            if (sQueryCompanyName) {
                aFilters.push(new Filter("CompanyName", FilterOperator.Contains, sQueryCompanyName));
            }
            if (sQueryCity) {
                aFilters.push(new Filter("City", FilterOperator.Contains, sQueryCity));
            }
            if (sQueryFax) {
                aFilters.push(new Filter("Fax", FilterOperator.Contains, sQueryFax));
            }

            oBinding.filter(aFilters);
        }
    });
});


