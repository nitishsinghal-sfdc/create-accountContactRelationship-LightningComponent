/**
 * Created by Nitish Singhal on 15/10/2019.
 * Controller Class for ManageContactAccountRole lightning component.
 */

public class AccountContactRoleController {
    private static List<String> allRoles = null;
    //variables to be used in the class.
    @AuraEnabled public static List<accountContactListWrapper> allAccountAndRoles{get;set;}

    /*
     Method used by component, where email address is passed and SOQL is done on contact database.
    */

    @AuraEnabled
    public static List <accountContactListWrapper> searchContacts(String searchEmail) {
        allAccountAndRoles = new List<accountContactListWrapper>();
        //search on contacts based on email and return contact and relationship records.
        List <Contact> contactList = [select id, (Select Id, IsDirect, Account.Name, contactId, Contact.Email, Contact.Name,Contact.FirstName, Contact.LastName, Contact.Birthdate, Contact.Phone, Roles from AccountContactRelations order by isDirect desc) from Contact where Email=: searchEmail];

        //if any of the condition below occurs, then prepare only one wrapper record with isError flag true and proper error message.
        if( contactList.size() == 0 || contactList.size() > 1){
            allAccountAndRoles.add(new accountContactListWrapper(contactList));
        }

        //otherwise, prepare the wrapper records with proper information to be used by lightning component.
        else {
            for (Contact eachContact : contactList) {
                for (AccountContactRelation acr : eachContact.AccountContactRelations) {
                        allAccountAndRoles.add(new accountContactListWrapper(acr, true));
                }
            }
        }

        //return the list of wrapper records.
        return allAccountAndRoles;
    }

    // a static method that returns the instance of the record type
    public static List<String> getAllRoles(){
        // lazy load the record type - only initialize if it doesn't already exist
        if(allRoles == null){
            allRoles = new List<String>();
            Schema.DescribeFieldResult fieldResult = AccountContactRelation.Roles.getDescribe();
            List<Schema.PicklistEntry> ple = fieldResult.getPicklistValues();
            for( Schema.PicklistEntry f : ple) {
                allRoles.add(f.getLabel());
            }
        }
        return allRoles;
    }

    /*
     Method used by component, where account is searched using keyword.
    */
    @AuraEnabled
    //public static List <accountContactListWrapper> searchAccounts(String searchKeyword, List<String> recordTypes) {
    public static List <accountContactListWrapper> searchAccounts(String searchKeyword) {
        List<accountContactListWrapper> accountsList = new List<accountContactListWrapper>();
        String searchString = '%'+searchKeyword+'%';

        //search on accounts based on name.
        for(Account acc: [select id, Name from Account where name like: searchString LIMIT 50]){
            accountsList.add(new accountContactListWrapper(new AccountContactRelation(Account = acc, AccountId=acc.id), false));
        }

        //return the list of wrapper records.
        return accountsList;
    }

    /*
     Method called on save button, passing the updated list of wrapper record with checkboxes and contact details.
     This method updates Roles field on relationship records and also insert an activity record with all the details required.
    */
    @AuraEnabled
    public static String updateRecords(List<accountContactListWrapper> listToUpdate, Contact contactDetails) {

        List<AccountContactRelation> finalListToUpdate = new List<AccountContactRelation>();

        //string that will hold all accounts relationships and roles.
        String relationshipStatusForActivity = '';

        //boolean field to track if all the account relationship records are set to unchecked/checked.
        Boolean allDisabled = true;
        String directAccountId = '';

        //find out the directAccountId for the contact.
        for(accountContactListWrapper wrapperRec : listToUpdate){
            if(wrapperRec.acrRec.IsDirect){
                directAccountId = wrapperRec.acrRec.AccountId;
                contactDetails.AccountId = directAccountId;
            }
        }

        //upsert contact.
        upsert contactDetails;

        AccountContactRelation directRelationship = [select Id from AccountContactRelation where isDirect = true AND ContactId =: contactDetails.Id LIMIT 1];
        //iterate on all the records and perform the logic.
        for(accountContactListWrapper wrapperRec : listToUpdate){

            //do with checked records
            if(wrapperRec.isChecked){
                allDisabled = false;

                //this string below is prepared to put into the activity record notes.
                relationshipStatusForActivity = relationshipStatusForActivity + wrapperRec.acrRec.Account.Name + ' : ' + String.join(SelectItem.getSemiColonSeparatedRoles(wrapperRec.selectedRoles),';') + ' \n';

                if(wrapperRec.acrRec.Id != null){
                    finalListToUpdate.add(new AccountContactRelation(Id=wrapperRec.acrRec.Id, AccountId = wrapperRec.acrRec.AccountId, Roles=String.join(SelectItem.getSemiColonSeparatedRoles(wrapperRec.selectedRoles),';')));
                }
                else{
                    if(wrapperRec.acrRec.AccountId != directAccountId) {
                        finalListToUpdate.add(new AccountContactRelation(AccountId = wrapperRec.acrRec.AccountId, ContactId = contactDetails.Id, Roles = String.join(SelectItem.getSemiColonSeparatedRoles(wrapperRec.selectedRoles), ';')));
                    }
                    if(wrapperRec.acrRec.AccountId == directAccountId){
                        finalListToUpdate.add(new AccountContactRelation(Id = directRelationship.Id, AccountId = wrapperRec.acrRec.AccountId, ContactId = contactDetails.Id, Roles = String.join(SelectItem.getSemiColonSeparatedRoles(wrapperRec.selectedRoles), ';')));
                    }
                }
            }
            //do with unchecked records.
            else{
                if(wrapperRec.acrRec.Id != null){
                    finalListToUpdate.add(new AccountContactRelation(Id = wrapperRec.acrRec.Id,Roles='Other'));
                    relationshipStatusForActivity = relationshipStatusForActivity + wrapperRec.acrRec.Account.Name + ' : ' + 'Other' + ' \n';
                }

            }

        }

        try {
            //update the contact account relationship records.
            upsert finalListToUpdate;

            //prepare the string to be used as description of activity.
            String descriptionForTask = 'Email: \n' + contactDetails.Email + '\n\nAccount Status: \n' + relationshipStatusForActivity;
            //descriptionForTask = descriptionForTask + (notes == null? '' : notes);

            //insert new activity against the contact record for the audit purpose.
            insert new Task(
                    Subject = 'Contact Account Relationships Updated',
                    WhoId = contactDetails.Id,
                    OwnerId = UserInfo.getUserId(),
                    ActivityDate = Date.today(),
                    Status = 'Completed',
                    Description = descriptionForTask

            );

            //return success if all good.
            return 'Success';
        }
        catch (Exception e){
            return 'Error : ' + e.getMessage();
        }
    }

    /* wrapper class to be returned for display on UI of lighting component.*/
    public class accountContactListWrapper {
        @AuraEnabled public Boolean isChecked {get;set;}
        @AuraEnabled public AccountContactRelation acrRec{get;set;}
        @AuraEnabled public Integer totalNumberOfContacts{get;set;}
        @AuraEnabled public Boolean isError{get;set;}
        @AuraEnabled public String errorMessage{get;set;}
        @AuraEnabled public List<SelectItem> selectedRoles{get;set;}
        @AuraEnabled public List<SelectItem> availableRoles{get;set;}

        public accountContactListWrapper(){}

        //constructor to be used in case of NO ERROR, everything fine.
        public accountContactListWrapper(AccountContactRelation acrRecord, Boolean isCheckedFlag){
            this.isError = false;
            this.isChecked = isCheckedFlag;
            this.acrRec = acrRecord;
            this.selectedRoles = new List<SelectItem>();
            this.availableRoles = new List<SelectItem>();
            this.totalNumberOfContacts = acrRecord.ContactId != null ? 1 : 0;
            //prepare the multi-select picklist values for roles.
            for(String eachRole : getAllRoles()){
                //if acr exists already.
                if(this.acrRec != null && this.acrRec.Roles != null && this.acrRec.Roles.containsIgnoreCase(eachRole)){
                    SelectItem s = new SelectItem(eachRole,eachRole,true);
                    this.selectedRoles.add(s);
                    this.availableRoles.add(s);
                }
                else{
                    this.availableRoles.add(new SelectItem(eachRole,eachRole,false));
                }
            }
        }

        //constructor to be used in case of any type of error condition.
        public accountContactListWrapper(List<Contact> contList){
            this.totalNumberOfContacts = contList.size();
            if(contList.size() > 1){
                this.isError = true;
                this.errorMessage = 'There are more than one record with this email.';
            }
        }
    }
}