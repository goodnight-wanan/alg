package edu.beihua.ju.dao.impl;

import edu.beihua.ju.dao.UserDao;
import edu.beihua.ju.entity.User;

public class UserDaoImpl implements UserDao {
    User uu[]=new User[2];

    public UserDaoImpl() {
        uu[0]=new User("小明","123456");
        uu[1]=new User("小红","123456");
    }

    @Override
    public boolean add(User user) {
        return false;
    }

    @Override
    public boolean update(User user) {
        return false;
    }

    @Override
    public boolean delete(Long id) {
        return false;
    }

    @Override
    public User quertbyName(String name) {

        for (User u:uu)
            if (u.getUsername().equals(name)){
                return u;
            }
        return null;
    }
}
