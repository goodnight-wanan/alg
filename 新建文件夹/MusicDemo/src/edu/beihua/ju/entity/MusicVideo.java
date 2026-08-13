package edu.beihua.ju.entity;

public class MusicVideo extends Music{
    private String mv;

    public MusicVideo() {
    }

    public MusicVideo(String ml_songname, String ml_singer, double ml_songtime, String ml_Albumtitle, String mv) throws Exception {
        super(ml_songname, ml_singer, ml_songtime, ml_Albumtitle);
        this.mv= mv;
    }

    public String getMv() {
        return mv;
    }

    public void setMv(String mv) throws Exception {
        if (mv.equals(" "))
            throw new Exception("不能为空");
        else
        this.mv = mv;
    }
}
