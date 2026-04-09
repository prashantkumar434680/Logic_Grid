const problem1 = {
  title: "Maximum Subarray Sum",

  description:
    "Given an array of integers, find the contiguous subarray with the largest sum and return that sum.\n\n" +
    "Example:\nInput: -2 1 -3 4 -1 2 1 -5 4\nOutput: 6\nExplanation: Subarray [4, -1, 2, 1] has the largest sum = 6",

  difficulty: "medium",

  tags: "array",

  visibleTestCases: [
    {
      input: "-2 1 -3 4 -1 2 1 -5 4",
      output: "6"
    },
    {
      input: "1 2 3 4",
      output: "10"
    }
  ],

  hiddenTestCases: [
    {
      input: "-1 -2 -3",
      output: "-1"
    }
  ],

  startCode: [
    {
      language: "C++",
      initialCode:
`#include <iostream>
using namespace std;

int maxSubArray(int arr[], int n) {
    // Write your code here
}

int main() {
    // Input handling
}`
    },
    {
      language: "Java",
      initialCode:
`public class Main {
    public static int maxSubArray(int[] arr) {
        // Write your code here
        return 0;
    }
}`
    },
    {
      language: "Javascript",
      initialCode:
`function maxSubArray(arr) {
    // Write your code here
}`
    }
  ],

  referenceSolution: [
    {
      language: "C++",
      completeCode:
`#include <iostream>
using namespace std;

int maxSubArray(int arr[], int n) {
    int maxSum = arr[0];
    int currSum = arr[0];

    for(int i = 1; i < n; i++) {
        currSum = max(arr[i], currSum + arr[i]);
        maxSum = max(maxSum, currSum);
    }
    return maxSum;
}`
    },
    {
      language: "Java",
      completeCode:
`public class Main {
    public static int maxSubArray(int[] arr) {
        int maxSum = arr[0];
        int currSum = arr[0];

        for(int i = 1; i < arr.length; i++) {
            currSum = Math.max(arr[i], currSum + arr[i]);
            maxSum = Math.max(maxSum, currSum);
        }
        return maxSum;
    }
}`
    },
    {
      language: "Javascript",
      completeCode:
`function maxSubArray(arr) {
    let maxSum = arr[0];
    let currSum = arr[0];

    for (let i = 1; i < arr.length; i++) {
        currSum = Math.max(arr[i], currSum + arr[i]);
        maxSum = Math.max(maxSum, currSum);
    }

    return maxSum;
}`
    }
  ]
};

module.exports.problem1 = problem1;

const problem = {
  title: "Reverse a Linked List",

  description:
    "Given the head of a singly linked list, reverse the list and return the new head.\n\n" +
    "A linked list is a linear data structure where each node contains a value and a pointer to the next node.\n\n" +
    "Example:\nInput: 1 -> 2 -> 3 -> 4 -> NULL\nOutput: 4 -> 3 -> 2 -> 1 -> NULL",

  difficulty: "easy",

  tags: "linked-list",

  visibleTestCases: [
    {
      input: "1 2 3 4",
      output: "4 3 2 1"
    },
    {
      input: "5 6 7",
      output: "7 6 5"
    }
  ],

  hiddenTestCases: [
    {
      input: "10",
      output: "10"
    }
  ],

  startCode: [
    {
      language: "C++",
      initialCode:
`#include <iostream>
using namespace std;

struct Node {
    int val;
    Node* next;
};

Node* reverseList(Node* head) {
    // Write your code here
}

int main() {
    // Input handling
}`
    },
    {
      language: "Java",
      initialCode:
`class ListNode {
    int val;
    ListNode next;
    ListNode(int val) { this.val = val; }
}

public class Main {
    public static ListNode reverseList(ListNode head) {
        // Write your code here
        return null;
    }
}`
    },
    {
      language: "Javascript",
      initialCode:
`// Definition for singly-linked list
function ListNode(val) {
    this.val = val;
    this.next = null;
}

function reverseList(head) {
    // Write your code here
}`
    }
  ],

  referenceSolution: [
    {
      language: "C++",
      completeCode:
`#include <iostream>
using namespace std;

struct Node {
    int val;
    Node* next;
};

Node* reverseList(Node* head) {
    Node* prev = NULL;
    Node* curr = head;
    while(curr != NULL) {
        Node* next = curr->next;
        curr->next = prev;
        prev = curr;
        curr = next;
    }
    return prev;
}

int main() {
    int x;
    Node* head = NULL;
    Node* tail = NULL;

    while(cin >> x) {
        Node* newNode = new Node{x, NULL};

        if(head == NULL) {
            head = tail = newNode;
        } else {
            tail->next = newNode;
            tail = newNode;
        }
    }

    head = reverseList(head);

    while(head != NULL) {
        cout << head->val << " ";
        head = head->next;
    }
}`
    },
    {
      language: "Java",
      completeCode:
`class ListNode {
    int val;
    ListNode next;
    ListNode(int val) { this.val = val; }
}

public class Main {
    public static ListNode reverseList(ListNode head) {
        ListNode prev = null;
        ListNode curr = head;
        while(curr != null) {
            ListNode next = curr.next;
            curr.next = prev;
            prev = curr;
            curr = next;
        }
        return prev;
    }
}`
    },
    {
      language: "Javascript",
      completeCode:
`// Definition for singly-linked list
function ListNode(val) {
    this.val = val;
    this.next = null;
}

function reverseList(head) {
    let prev = null;
    let curr = head;

    while (curr !== null) {
        let next = curr.next;
        curr.next = prev;
        prev = curr;
        curr = next;
    }

    return prev;
}

// Driver Code (for testing)
function buildList(arr) {
    let head = null, tail = null;
    for (let val of arr) {
        let node = new ListNode(val);
        if (!head) {
            head = tail = node;
        } else {
            tail.next = node;
            tail = node;
        }
    }
    return head;
}

function printList(head) {
    let res = [];
    while (head) {
        res.push(head.val);
        head = head.next;
    }
    console.log(res.join(" "));
}

// Example
let input = [1,2,3,4];
let head = buildList(input);
head = reverseList(head);
printList(head);`
    }
  ]
};

module.exports = problem;