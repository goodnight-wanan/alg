package edu.beihua.ju.dao;

import edu.beihua.ju.entity.User;

import java.util.List;

public interface UserDao {

    boolean add (User user);
    boolean update(User user);
    boolean delete(Long id);

    User quertbyName(String name) throws Exception;


}
