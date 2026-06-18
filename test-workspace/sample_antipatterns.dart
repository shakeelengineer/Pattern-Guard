// ============================================================
// Pattern Guard — Sample Dart file with intentional anti-patterns
// Run "Analyze Project" in the Pattern Guard sidebar to detect them.
// ============================================================

import 'package:flutter/material.dart';

// ── NON-FUNCTIONAL REQUIREMENTS: missing doc comments ──────────
class UserManager {  // no doc comment → NonFunctional issue

  // ── GOD OBJECT: 21+ methods in one class ───────────────────
  void method01() {}
  void method02() {}
  void method03() {}
  void method04() {}
  void method05() {}
  void method06() {}
  void method07() {}
  void method08() {}
  void method09() {}
  void method10() {}
  void method11() {}
  void method12() {}
  void method13() {}
  void method14() {}
  void method15() {}
  void method16() {}
  void method17() {}
  void method18() {}
  void method19() {}
  void method20() {}
  void method21() {}  // exceeds threshold of 20 → God Object issue

  // ── SPAGHETTI CODE: deep nesting ───────────────────────────
  void deeplyNested(bool a, bool b, bool c, bool d, bool e) {
    if (a) {
      if (b) {
        if (c) {
          if (d) {
            if (e) {
              // 5 levels deep → Spaghetti Code issue
              print('too deep');
            }
          }
        }
      }
    }
  }

  // ── SHOTGUN SURGERY: hard-coded value repeated across files ─
  String getBaseUrl() => "https://api.myapp.com/v1";
  String getAltUrl() => "https://api.myapp.com/v1";

  // ── LAVA FLOW: TODO markers ─────────────────────────────────
  // TODO: refactor this entire class
  // TODO: add proper error handling
  // FIXME: remove dead code below

  // void oldUnusedMethod() {
  //   print('this was the old way');
  //   return null;
  // }

  // ── COPY-PASTE: duplicated block ───────────────────────────
  void processUserA() {
    final data = fetchData();
    validate(data);
    transform(data);
    save(data);
    notify(data);
    log(data);
    audit(data);
    cleanup(data);
  }

  void processUserB() {
    final data = fetchData();
    validate(data);
    transform(data);
    save(data);
    notify(data);
    log(data);
    audit(data);
    cleanup(data);
  }

  dynamic fetchData() => null;
  void validate(dynamic d) {}
  void transform(dynamic d) {}
  void save(dynamic d) {}
  void notify(dynamic d) {}
  void log(dynamic d) {}
  void audit(dynamic d) {}
  void cleanup(dynamic d) {}
}
