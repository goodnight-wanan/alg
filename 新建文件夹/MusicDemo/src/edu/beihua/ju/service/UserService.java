package edu.beihua.ju.service;

import edu.beihua.ju.entity.User;

import java.util.List;

public interface UserService {
    public void login() throws Exception;

    public void register() throws Exception;


    public void SearchMyPlaylist() throws Exception;

//    public void AddToPl() throws Exception;

    public void Collection();

    public void Comments();

    public void PlayMusic();

    public void StopMusic();

    public void searchMusic() throws Exception;



    public void searchPlaylist();
}
