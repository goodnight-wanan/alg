package edu.beihua.ju.entity;

public class Member extends User{
    private int grade;

    public Member() {
    }

    public Member(String username, String password, int grade) {
        super(username, password);
        this.grade = grade;
    }

    public int getGrade() {
        return grade;
    }

    public void setGrade(int grade) throws Exception{
        if(grade<0||grade>10){
            throw new Exception("等级必须在0-10之间");
        }
        this.grade = grade;
    }
}
