package edu.beihua.ju.entity;

public class Music {
    private String ml_songname;
    private String ml_singer;
    private double ml_songtime;
    private String ml_Albumtitle;
    private boolean isDelete;

    public String getMl_songname() {
        return ml_songname;
    }

    public void setMl_songname(String ml_songname)
    {

        this.ml_songname = ml_songname;
    }

    public String getMl_singer() {
        return ml_singer;
    }

    public void setMl_singer(String ml_singer) throws Exception{
        if(ml_singer.length()>=2) {
            this.ml_singer = ml_singer;
        }else
            throw new Exception("输入的歌手名不合法，必须大于等于两位数");

    }

    public double getMl_songtime() {
        return ml_songtime;
    }

    public void setMl_songtime(double ml_songtime)throws Exception {
        if(ml_songtime>0) {
            this.ml_songtime = ml_songtime;
        }
            else
            throw new Exception("输入的歌曲时长不合法，必须大于0");


    }

    public String getMl_Albumtitle() {
        return ml_Albumtitle;
    }

    public void setMl_Albumtitle(String ml_Albumtitle) throws Exception{
        if(ml_Albumtitle.length()>=1) {
            this.ml_Albumtitle = ml_Albumtitle;
        }
        else
            throw new Exception("输入的专辑名称不合法，必须大于等于一位数");

    }

    public Music(){

    }

    public boolean isDelete() {
        return isDelete;
    }
    public void setDelete(boolean delete) {
        isDelete = delete;
    }



    public Music(String ml_songname, String ml_singer, double ml_songtime, String ml_Albumtitle) throws Exception{
        if(ml_songname.length()>=1){
            this.ml_songname=ml_songname;
        }else{
            throw new Exception("歌曲名称错误，必须大于等于一位数");
        }
        if(ml_singer.length()>=2){
            this.ml_singer=ml_singer;
        }else{
            throw new Exception("歌手信息错误，必须大于等于两位数");
        }
        if(ml_songtime>0){
            this.ml_songtime=ml_songtime;
        }else{
            throw new Exception("歌曲时长错误");
        }
        if(ml_Albumtitle.length()>=1){
            this.ml_Albumtitle=ml_Albumtitle;
        }else {
            throw new Exception("专辑名称错误");
        }
    }

    @Override
    public String toString() {
        return
                "歌曲名称=" + ml_songname +
                ", 歌手=" + ml_singer +
                ", 时长=" + ml_songtime +
                ", 专辑='" + ml_Albumtitle ;
    }
}

