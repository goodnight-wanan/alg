package edu.beihua.ju.dao;

import edu.beihua.ju.entity.Manager;


public interface ManagerDao {

	
	boolean addManager(Manager mm);
	boolean deleManager(Manager uName);
	boolean updateManager(Manager uName);
	Manager	 queryByUserName(String uName);
	
	
	
}
