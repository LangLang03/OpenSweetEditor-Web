package demo.codelens;

import java.util.ArrayList;
import java.util.List;

public class CodeLensDemo {
    public static void main(String[] args) {
        CodeLensDemo demo = new CodeLensDemo();
        demo.run();
    }

    public void run() {
        List<String> values = new ArrayList<>();
        values.add("alpha");
        values.add("beta");
        values.forEach(this::log);
    }

    private void log(String value) {
        System.out.println("value = " + value);
    }

    private int sum(int a, int b) {
        return a + b;
    }
}
