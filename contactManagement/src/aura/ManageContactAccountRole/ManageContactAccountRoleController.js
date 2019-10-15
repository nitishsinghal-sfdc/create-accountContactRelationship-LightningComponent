({
    /*
      Method called if user's focus is on email field and user hits ENTER key.
    */
    searchContactOnEnterKey: function(component, event, helper) {
        if (event.keyCode === 13) { //Enter key code is 13
            //validate the email input, if all good, then search for the contacts.
            if(helper.validateEmailInput(component,event)){
               helper.SearchContactsHelper(component,event);
            }
        }
    },

    /*
    Method called on click of Search button for contact search.
    */
    searchContact: function(component, event, helper) {
        //validate the email input, if all good, then search for the contacts.
        if(helper.validateEmailInput(component,event)){
           helper.SearchContactsHelper(component,event);
        }
    },

    /*
      Method called if user's focus is on account search field and user hits ENTER key.
    */
    searchAccount: function(component, event, helper) {
        if (event.keyCode === 13) { //Enter key code is 13
            //get the search keyword from Account search field.
            var searchAccKeyword = component.get("v.searchAccKeyword");

            //validate the input first, we need at least 2 characters to search. If validation fails, add the error message to the field.
            if(searchAccKeyword !== undefined && searchAccKeyword !== '' && searchAccKeyword.length < 2){
                var searchAccountField = component.find("searchAccount");
                searchAccountField.setCustomValidity("You must enter at least 2 characters");
                searchAccountField.reportValidity();
                return;
            }
            //otherwise remove the existing error message from field (if any) and initiate search.
            else{
                var searchAccountField = component.find("searchAccount");
                searchAccountField.setCustomValidity("");
                searchAccountField.reportValidity();
                helper.SearchAccountsHelper(component,event);
            }

        }
    },

    //data validation before somebody saves the form.
    validateData: function(component,event,helper){
        var dataList = component.get("v.dataRecords");
        var allUnchecked = true;
        var roleNotSelected = false;
        var accountNamesWithoutRoles = [];
        var firstNameField = component.find("firstName");
        var lastNameField = component.find("lastName");
        if(firstNameField != undefined)
        firstNameField.setCustomValidity("");
        if(lastNameField != undefined)
        lastNameField.setCustomValidity("");
        for (var i=0; i<dataList.length;i++) {
          if(dataList[i].isChecked){
              allUnchecked = false;
              if(dataList[i].selectedRoles == undefined || dataList[i].selectedRoles.length == 0){
                  roleNotSelected = true;
                  accountNamesWithoutRoles.push(dataList[i].acrRec.Account.Name);
              }
          }
        }
        if((component.get("v.contactRec.FirstName") == '' || component.get("v.contactRec.LastName") == '') && firstNameField != undefined && lastNameField != undefined){
            if(component.get("v.contactRec.FirstName") == ''){
                firstNameField.setCustomValidity("Please enter a value");
                firstNameField.reportValidity();
            }
            else{
                firstNameField.setCustomValidity("");
                firstNameField.reportValidity();
            }
            if(component.get("v.contactRec.LastName") == ''){
                lastNameField.setCustomValidity("Please enter a value");
                lastNameField.reportValidity();
            }
            else{
                lastNameField.setCustomValidity("");
                lastNameField.reportValidity();
            }
            return;
        }
        else{
            if(firstNameField != undefined)
            firstNameField.reportValidity();
            if(lastNameField != undefined)
            lastNameField.reportValidity();
        }
        if(allUnchecked){
            var toastEvent = $A.get("e.force:showToast");
            toastEvent.setParams({title: "Error!",message: "No Account has been Selected for Association",duration:'5000',type:'error'});
            toastEvent.fire();
            return;
        }
        if(roleNotSelected){
            var toastEvent = $A.get("e.force:showToast");
            var errorMessage = "Please Select Roles on " + accountNamesWithoutRoles.join(',');
            toastEvent.setParams({title: "Error!",message: errorMessage,duration:'5000',type:'error'});
            toastEvent.fire();
            return;
        }
        else{
            var saveData = component.get("c.saveData");
            $A.enqueueAction(saveData);
        }
    },

    //method called on the click of save button.
    saveData: function(component,event,helper){

      var dataList = component.get("v.dataRecords");
      var noDirectAccountSelected = true;
      var allUnchecked = true;
      var directAccountChecked = false;
      for (var i=0; i<dataList.length;i++) {
          if(dataList[i].acrRec.IsDirect){
              noDirectAccountSelected = false;
          }
          if(dataList[i].isChecked){
              allUnchecked = false;
          }
          if(dataList[i].acrRec.IsDirect && dataList[i].isChecked){
              directAccountChecked = true;
          }
      }
      if(noDirectAccountSelected){
        var toastEvent = $A.get("e.force:showToast");
        toastEvent.setParams({title: "Error!",message: "There is no direct account being selected for this contact.",duration:'5000',type:'error'});
        toastEvent.fire();
        return;
       }
      helper.saveData(component,event);
    },

    /*
      Method used to enable/disable save button on the basis of customer confirmation checkbox.
    */
    enableDisableSaveButton: function(component,event,helper){
      var isCheckboxChecked = component.get("v.customerConfirmation");
      if(isCheckboxChecked){
        component.find('btnRun').set('v.disabled',false);
      }
      else{
          component.find('btnRun').set('v.disabled',true);
      }
    },

    /*
      Method used to uncheck all other direct account checkboxes.
      And also select the account automatically if someone has select directAccount checkbox.
    */
    directAccountChanged: function(component,event,helper){
      var newDirectAccountId = event.getSource().get("v.label");
      var dataList = component.get("v.dataRecords");
      for (var i=0; i<dataList.length;i++) {
        if(dataList[i].acrRec.AccountId !== newDirectAccountId){
          dataList[i].acrRec.IsDirect = false;
        }
        if(dataList[i].acrRec.AccountId == newDirectAccountId){
          dataList[i].isChecked = true;
        }
      }
      component.set("v.dataRecords",dataList);
      component.set("v.directAccountId",newDirectAccountId);
    },

    /*
      Method used to automatically uncheck the direct account box if somebody deselects any account.
    */
    selectedAccountChanged: function(component,event,helper){
      var checkedRowAccountId = event.getSource().get("v.label");
      var dataList = component.get("v.dataRecords");
      for (var i=0; i<dataList.length;i++) {
        if(dataList[i].isChecked == false && dataList[i].acrRec.AccountId == checkedRowAccountId){
          dataList[i].acrRec.IsDirect = false;
        }
      }
      component.set("v.dataRecords",dataList);

    },
})