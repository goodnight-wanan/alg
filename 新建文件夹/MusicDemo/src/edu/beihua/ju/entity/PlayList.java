package edu.beihua.ju.entity;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

public class PlayList {
    public String PL_name;

    public String pl_description;

    public PlayList() {
    }

    public PlayList(String PL_name, String pl_description) {
        this.PL_name = PL_name;
        this.pl_description = pl_description;
    }

    public String getPL_name() {
        return PL_name;
    }

    public void setPL_name(String PL_name)throws  Exception {
           if(PL_name.length()>10){
             throw new Exception("歌单名称不能超过10个字符");
         }
        this.PL_name = PL_name;
    }


    public String getPl_description()  {
        return pl_description;
    }

    public void setPl_descripetion(String pl_description) throws Exception{
        if(pl_description.length()>100){
            throw new Exception("歌单描述不能超过100个字符");
        }
        this.pl_description = pl_description;
    }
}
