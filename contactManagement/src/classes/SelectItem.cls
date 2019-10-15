/**
 * Created by Nitish Singhal on 15/10/2019.
 * Wrapper class for Multi Picklist values
 */

public class SelectItem {

  @AuraEnabled public String  Id  {get; set;}
  @AuraEnabled public String  Name  {get; set;}
  @AuraEnabled public Boolean  selected  {get; set;}

    public SelectItem(){}
    
  public SelectItem( String Id, String Name, Boolean selected) {
    this(Id,Name);
    this.selected = selected;
  }

	public SelectItem( String Id, String Name) {
		this.Id = Id;
        this.Name = Name;
        this.selected = false;
	}

    public static List<String> getSemiColonSeparatedRoles(List<SelectItem> allSelectedItems){
        List<String> finalRoles = new List<String>();
        for(SelectItem s : allSelectedItems){

            finalRoles.add(s.Name);
        }
        return finalRoles;
    }
}