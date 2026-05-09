const a = [
    {
        {
  "title": "Merge Two Sorted Linked Lists",

  "description": "Given the heads of two sorted linked lists, merge them into a single sorted linked list and return the head of the merged list.\n\nThe merged linked list should also be sorted in non-decreasing order.\n\nExample 1:\nInput:\n1 3 5 | 2 4 6\nOutput:\n1 2 3 4 5 6\nExplanation: Both linked lists are merged into one sorted linked list.\n\nExample 2:\nInput:\n1 2 3 | 4 5\nOutput:\n1 2 3 4 5\nExplanation: All elements are merged in sorted order.\n\nExample 3:\nInput:\n1 | \nOutput:\n1\nExplanation: Second linked list is empty.",

  "difficulty": "easy",

  "tags": ["linked-list", "two-pointers"],

  "constraints": [
    "0 <= Number of nodes <= 10^4",
    "-10^5 <= Node.val <= 10^5",
    "Both linked lists are sorted in non-decreasing order"
  ],

  "visibleTestCases": [
    {
      "input": "1 3 5 | 2 4 6",
      "output": "1 2 3 4 5 6",
      "explanation": "Merged sorted list"
    },
    {
      "input": "1 2 3 | 4 5",
      "output": "1 2 3 4 5",
      "explanation": "All elements merged in order"
    }
  ],

  "hiddenTestCases": [
    {
      "input": "1 | ",
      "output": "1"
    },
    {
      "input": " | 2 4 6",
      "output": "2 4 6"
    },
    {
      "input": "1 1 2 | 1 3 4",
      "output": "1 1 1 2 3 4"
    }
  ],

  "startCode": [
    {
      "language": "C++",
      "initialCode": "#include <bits/stdc++.h>\nusing namespace std;\n\nstruct Node {\n    int val;\n    Node* next;\n\n    Node(int x) {\n        val = x;\n        next = NULL;\n    }\n};\n\nNode* mergeLists(Node* l1, Node* l2) {\n    // Write your code here\n}\n\nint main() {\n    return 0;\n}"
    },

    {
      "language": "Java",
      "initialCode": "class ListNode {\n    int val;\n    ListNode next;\n\n    ListNode(int val) {\n        this.val = val;\n        this.next = null;\n    }\n}\n\npublic class Main {\n\n    public static ListNode mergeLists(ListNode l1, ListNode l2) {\n        // Write your code here\n        return null;\n    }\n\n    public static void main(String[] args) {\n    }\n}"
    },

    {
      "language": "JavaScript",
      "initialCode": "function ListNode(val) {\n    this.val = val;\n    this.next = null;\n}\n\nfunction mergeLists(l1, l2) {\n    // Write your code here\n}"
    }
  ],

  "referenceSolution": [
    {
      "language": "C++",
      "completeCode": "#include <bits/stdc++.h>\nusing namespace std;\n\nstruct Node {\n    int val;\n    Node* next;\n\n    Node(int x) {\n        val = x;\n        next = NULL;\n    }\n};\n\nNode* mergeLists(Node* l1, Node* l2) {\n    Node dummy(0);\n    Node* tail = &dummy;\n\n    while(l1 && l2) {\n        if(l1->val <= l2->val) {\n            tail->next = l1;\n            l1 = l1->next;\n        }\n        else {\n            tail->next = l2;\n            l2 = l2->next;\n        }\n\n        tail = tail->next;\n    }\n\n    if(l1) {\n        tail->next = l1;\n    }\n\n    if(l2) {\n        tail->next = l2;\n    }\n\n    return dummy.next;\n}\n\nint main() {\n    return 0;\n}"
    },

    {
      "language": "Java",
      "completeCode": "class ListNode {\n    int val;\n    ListNode next;\n\n    ListNode(int val) {\n        this.val = val;\n        this.next = null;\n    }\n}\n\npublic class Main {\n\n    public static ListNode mergeLists(ListNode l1, ListNode l2) {\n        ListNode dummy = new ListNode(0);\n        ListNode tail = dummy;\n\n        while(l1 != null && l2 != null) {\n            if(l1.val <= l2.val) {\n                tail.next = l1;\n                l1 = l1.next;\n            }\n            else {\n                tail.next = l2;\n                l2 = l2.next;\n            }\n\n            tail = tail.next;\n        }\n\n        if(l1 != null) {\n            tail.next = l1;\n        }\n\n        if(l2 != null) {\n            tail.next = l2;\n        }\n\n        return dummy.next;\n    }\n\n    public static void main(String[] args) {\n    }\n}"
    },

    {
      "language": "JavaScript",
      "completeCode": "function ListNode(val) {\n    this.val = val;\n    this.next = null;\n}\n\nfunction mergeLists(l1, l2) {\n    const dummy = new ListNode(0);\n    let tail = dummy;\n\n    while(l1 && l2) {\n        if(l1.val <= l2.val) {\n            tail.next = l1;\n            l1 = l1.next;\n        }\n        else {\n            tail.next = l2;\n            l2 = l2.next;\n        }\n\n        tail = tail.next;\n    }\n\n    if(l1) {\n        tail.next = l1;\n    }\n\n    if(l2) {\n        tail.next = l2;\n    }\n\n    return dummy.next;\n}"
    }
  ]
}
    }
]