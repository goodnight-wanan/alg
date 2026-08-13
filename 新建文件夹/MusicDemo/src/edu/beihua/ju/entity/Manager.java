package edu.beihua.ju.entity;

public class Manager extends User{
	String managerLevel;

	public Manager(String managerLevel) {
		this.managerLevel = managerLevel;
	}

	public String getManagerLevel() {

		return managerLevel;
	}


	public void setManagerLevel(String managerLevel) throws Exception{
		if(managerLevel.equals(" ")){
			throw new Exception("管理员级别不能为空");
		}else
		this.managerLevel = managerLevel;
	}


	public Manager(String uName, String uPass, String managerLevel) {
		super(uName, uPass);
		this.managerLevel = managerLevel;
	}


		
	}


