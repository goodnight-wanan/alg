package edu.beihua.ju.entity;

public class AbsoluteMusic extends Music{

    private String instruments;
    public AbsoluteMusic() {
    }

    public AbsoluteMusic(String ml_songname, String ml_singer, double ml_songtime, String ml_Albumtitle, String instruments) throws Exception {
        super(ml_songname, ml_singer, ml_songtime, ml_Albumtitle);
        this.instruments = instruments;
    }

    public String getInstruments() {
        return instruments;
    }

    public void setInstruments(String instruments) throws Exception {

        if(instruments.equals("")){
            throw new Exception("乐器不能为空");
        }else
        this.instruments = instruments;
    }
}
