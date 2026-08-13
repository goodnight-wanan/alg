package edu.beihua.ju.service;

import edu.beihua.ju.entity.Manager;
import edu.beihua.ju.entity.Music;


public interface MangerService {


	boolean addManager(Manager mm);

	boolean deleManager(Manager mm);
	boolean updateManager(Manager mm);
	Manager	 queryByUserName(String uName) throws Exception;
}
