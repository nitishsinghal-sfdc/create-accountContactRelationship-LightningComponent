({
    //method to search the contacts based on email.
    SearchContactsHelper: function(component, event) {
        this.resetForm(component,event);
        // show spinner on screen.
        component.find("Id_spinner").set("v.class" , 'slds-show');

        //get the apex controller reference.
        var action = component.get("c.searchContacts");
        //set the parameters to be passed to the method.
        action.setParams({'searchEmail': component.get("v.contactRec.Email")});
        //set the callback feature after getting the response.
        action.setCallback(this, function(response) {
            //hide spinner when response coming from server
            component.find("Id_spinner").set("v.class" , 'slds-hide');
            var state = response.getState();
            console.log('this is state '+ state);
            if (state === "SUCCESS") {
                var responseRecords = response.getReturnValue();
                component.set("v.dataRecords", responseRecords);
                if(responseRecords[0].totalNumberOfContacts == 1){
                    component.set("v.contactRec",responseRecords[0].acrRec.Contact);
                    for (var i=0; i<responseRecords.length;i++) {
                      if(responseRecords[i].acrRec.IsDirect === true){
                        component.set("v.directAccountId",responseRecords[i].acrRec.AccountId);
                      }
                    }
                }
                if(responseRecords[0].totalNumberOfContacts == 0){
                    var toastEvent = $A.get("e.force:showToast");
                    toastEvent.setParams({"title": "No Contact Found, Create New??", "message": "Contact with this email does not exist. You can create a new contact and associate with existing accounts.","type":'warning',duration:'10000'});
                    toastEvent.fire();
                    component.set("v.contactRec.Id",null);
                    component.set("v.contactRec.FirstName","");
                    component.set("v.contactRec.LastName","");
                    component.set("v.contactRec.Name","");
                    component.set("v.contactRec.Birthdate","");
                    component.set("v.contactRec.Phone","");
                }


            }else if (state === "INCOMPLETE") {
                alert('Response is Incomplete');
            }else if (state === "ERROR") {
                var errors = response.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                        alert("Error message: " + 
                                    errors[0].message);
                    }
                } else {
                    alert("Unknown error");
                }
            }
        });
        $A.enqueueAction(action);
    },

    //method to search the accounts based on keyword entered.
    SearchAccountsHelper: function(component, event) {
        // show spinner on screen.
        component.find("Id_spinner").set("v.class" , 'slds-show');

        //get the apex controller reference.
        var action = component.get("c.searchAccounts");

        /*var recordTypeCriteria = [];
        if(component.get("v.searchOrgAccount") == true){
            recordTypeCriteria.push('Organization');
        }
        if(component.get("v.searchHouseHoldAccount") == true){
            recordTypeCriteria.push('Household');
        }
        if(component.get("v.searchBoth") == true){
            recordTypeCriteria.push('Organization');
            recordTypeCriteria.push('Household');
        }*/

        //action.setParams({'searchKeyword': component.get("v.searchAccKeyword"),'recordTypes': recordTypeCriteria});
        action.setParams({'searchKeyword': component.get("v.searchAccKeyword")});
        //set the callback feature after getting the response.
        action.setCallback(this, function(response) {
            //hide spinner when response coming from server
            component.find("Id_spinner").set("v.class" , 'slds-hide');
            var state = response.getState();
            if (state === "SUCCESS") {
                var responseRecords = response.getReturnValue();
                var currentList = component.get("v.dataRecords");
                var newList = [];
                var existingIds = [];
                for(var i=0;i<currentList.length;i++){
                    if((currentList[i].acrRec != null && currentList[i].acrRec.Id != '' && currentList[i].acrRec.Id != null) || currentList[i].isChecked){
                        newList.push(currentList[i]);
                        existingIds.push(currentList[i].acrRec.AccountId);
                    }
                }

                //if response has got isError flag true, then set component variables accordingly.
                if(responseRecords.length > 0){
                    for(var i=0; i<responseRecords.length;i++){
                        if(!existingIds.includes(responseRecords[i].acrRec.AccountId))
                        newList.push(responseRecords[i]);
                    }
                    var searchAccountField = component.find("searchAccount");
                    searchAccountField.setCustomValidity("");
                    searchAccountField.reportValidity();
                    component.set("v.dataRecords",newList);
                    component.set("v.NumberOfAccountsInSearchResultMessage",responseRecords.length + ' Account(s) Found');
                }
                else{
                    for(var i=0; i<responseRecords.length;i++){
                        if(existingIds.includes(responseRecords[i].acrRec.AccountId))
                            newList.push(responseRecords[i]);
                    }
                    var searchAccountField = component.find("searchAccount");
                    searchAccountField.setCustomValidity("No Account found.");
                    searchAccountField.reportValidity();
                    component.set("v.dataRecords",newList);
                    component.set("v.NumberOfAccountsInSearchResultMessage",'');
                }
            }else if (state === "INCOMPLETE") {
                alert('Response is incomplete');
            }else if (state === "ERROR") {
                var errors = response.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                        alert("Error message: " +
                                    errors[0].message);
                    }
                } else {
                    alert("Unknown error");
                }
            }
        });
        $A.enqueueAction(action);
    },

    //method called by save button to save records in SF.
    saveData: function(component, event) {
        // show spinner
        component.find("Id_spinner").set("v.class" , 'slds-show');
        var action = component.get("c.updateRecords");
        action.setParams({
            'listToUpdate': component.get("v.dataRecords"),
            'contactDetails': component.get("v.contactRec")
        });
        action.setCallback(this, function(response) {
            //hide spinner when response coming from server
            component.find("Id_spinner").set("v.class" , 'slds-hide');
            var state = response.getState();
            if (state === "SUCCESS") {
                //print on console for debugging.
                var responseString = response.getReturnValue();
                //show the toast with Success message if the response is success from server.
                var toastEvent = $A.get("e.force:showToast");
                toastEvent.setParams({"title": responseString + "!","message": "The records have been updated successfully.","type":'success'});
                toastEvent.fire();
                this.resetForm(component,event);
                component.set("v.contactRec.Email","");

            }else if (state === "INCOMPLETE") {
                alert('Response is incomplete');
            }else if (state === "ERROR") {
                var errors = response.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                        var responseString = response.getReturnValue();
                        //show the toast with Error message if the response is error from server.
                        var toastEvent = $A.get("e.force:showToast");
                        toastEvent.setParams({"title": "Error:" ,"message": errors[0].message + ". Please contact your system administrator.","type":"error"});
                        toastEvent.fire();
                    }
                } else {
                    alert("Unknown error");
                }
            }
        });
        $A.enqueueAction(action);
    },

    //method to reset the values when someone searches again.
    resetForm: function(component,event){
      //resetting few fields before you start the search, to have the UI in fresh state.

      if(component.find('btnRun') !== undefined)component.find('btnRun').set('v.disabled',true);
      component.set("v.dataRecords","");
      component.set("v.searchAccKeyword","");
      component.set("v.contactRec.Id",null);
      component.set("v.contactRec.FirstName","");
      component.set("v.contactRec.LastName","");
      component.set("v.contactRec.Name","");
      component.set("v.contactRec.Birthdate","");
      component.set("v.contactRec.Phone","");
      component.set("v.NumberOfAccountsInSearchResultMessage",'');
    },

    /*
    Method called on click of Search button on UI.
    */
    validateEmailInput: function(component, event) {
        var searchEmail = component.get("v.contactRec.Email");
        var isValidEmail = true;
        var emailField = component.find("searchEmail");
        emailField.setCustomValidity("");
        var regExpEmailformat = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;


        if(searchEmail == undefined || searchEmail == ''){
            emailField.setCustomValidity("Please enter a value");
            isValidEmail = false;
        }
        else if(!searchEmail.match(regExpEmailformat)){
          emailField.setCustomValidity("Please enter a valid email");
          isValidEmail = false;
        }

        emailField.reportValidity();
        return isValidEmail;
    },
})