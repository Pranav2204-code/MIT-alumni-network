/**
 * seedQuizzes.js
 *
 * Seeds the Quiz collection with starter quizzes for MIT-WPU students.
 * Safe to re-run – uses upsert on title.
 *
 * Usage:
 *   node src/scripts/seedQuizzes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Quiz     = require('../models/Quiz');

const QUIZZES = [
  {
    title: 'Cybersecurity Fundamentals',
    category: 'cybersecurity',
    timeLimitMinutes: 15,
    passScore: 70,
    pointsAwarded: 1,
    questions: [
      {
        text: 'Which of the following best describes a "man-in-the-middle" attack?',
        options: [
          'Flooding a server with traffic to exhaust resources',
          'Secretly intercepting and possibly altering communications between two parties',
          'Injecting malicious code into a database query',
          'Exploiting a buffer overflow in kernel memory',
        ],
        correctIndex: 1,
        explanation: 'In a MITM attack the adversary secretly relays and potentially alters messages between two parties who believe they are communicating directly.',
        difficulty: 'easy',
      },
      {
        text: 'What does the principle of "least privilege" mean?',
        options: [
          'Users should have the minimum access necessary to do their job',
          'The system with the least load gets the highest privilege',
          'Admins should never share passwords',
          'Encryption keys must be rotated every 90 days',
        ],
        correctIndex: 0,
        explanation: 'Least privilege limits each entity to only the permissions required for its current task, reducing the attack surface.',
        difficulty: 'easy',
      },
      {
        text: 'Which hashing algorithm is considered cryptographically broken and should NOT be used for passwords?',
        options: ['bcrypt', 'Argon2', 'MD5', 'scrypt'],
        correctIndex: 2,
        explanation: 'MD5 produces only a 128-bit hash and is vulnerable to collision attacks and rainbow tables. Never use it for passwords.',
        difficulty: 'easy',
      },
      {
        text: 'A SQL injection attack exploits:',
        options: [
          'Weak encryption algorithms',
          'Insufficient input validation allowing SQL to be injected into queries',
          'Open CORS policies on an API',
          'Default admin credentials left unchanged',
        ],
        correctIndex: 1,
        explanation: 'SQL injection occurs when user-supplied input is concatenated into SQL queries without sanitization, letting an attacker manipulate the query.',
        difficulty: 'medium',
      },
      {
        text: 'What is the purpose of a digital certificate (X.509)?',
        options: [
          'To compress data during transmission',
          'To bind a public key to an identity, verified by a Certificate Authority',
          'To store private keys securely in the cloud',
          'To provide symmetric encryption for HTTPS',
        ],
        correctIndex: 1,
        explanation: 'X.509 certificates bind an entity\'s public key to its identity, signed by a trusted CA, enabling others to verify authenticity.',
        difficulty: 'medium',
      },
      {
        text: 'Which OSI layer does a firewall that inspects packet headers (IP/TCP) operate at?',
        options: ['Layer 2 – Data Link', 'Layer 3/4 – Network/Transport', 'Layer 7 – Application', 'Layer 1 – Physical'],
        correctIndex: 1,
        explanation: 'Packet-filtering firewalls inspect IP and TCP/UDP headers, operating at Layers 3 and 4 of the OSI model.',
        difficulty: 'medium',
      },
      {
        text: 'What does "non-repudiation" ensure in cryptographic systems?',
        options: [
          'Only the intended recipient can read the message',
          'The message was not modified in transit',
          'The sender cannot deny having sent the message',
          'The message is encrypted end-to-end',
        ],
        correctIndex: 2,
        explanation: 'Non-repudiation, typically provided by digital signatures, ensures a sender cannot later deny sending a message.',
        difficulty: 'hard',
      },
      {
        text: 'What is the primary difference between symmetric and asymmetric encryption?',
        options: [
          'Symmetric uses one shared key; asymmetric uses a public/private key pair',
          'Symmetric is only used for hashing; asymmetric is used for bulk data',
          'Symmetric encryption is always slower than asymmetric',
          'Asymmetric encryption doesn\'t require keys',
        ],
        correctIndex: 0,
        explanation: 'Symmetric encryption uses the same key for encryption and decryption. Asymmetric uses a mathematically linked key pair: a public key to encrypt and a private key to decrypt.',
        difficulty: 'easy',
      },
      {
        text: 'Which attack type involves sending more data than a buffer can hold to overwrite adjacent memory?',
        options: ['Cross-Site Scripting (XSS)', 'Buffer Overflow', 'CSRF', 'DNS Poisoning'],
        correctIndex: 1,
        explanation: 'A buffer overflow occurs when a program writes more data to a buffer than it can hold, potentially overwriting return addresses and allowing arbitrary code execution.',
        difficulty: 'medium',
      },
      {
        text: 'What does "salting" a password before hashing accomplish?',
        options: [
          'Speeds up the hashing process',
          'Reduces the hash output length',
          'Ensures two identical passwords produce different hashes, defeating rainbow tables',
          'Encrypts the hash with a master key',
        ],
        correctIndex: 2,
        explanation: 'A salt is a unique random value prepended to each password before hashing. It ensures identical passwords produce distinct hashes, making precomputed rainbow table attacks infeasible.',
        difficulty: 'medium',
      },
    ],
  },
  {
    title: 'Data Structures & Algorithms',
    category: 'dsa',
    timeLimitMinutes: 20,
    passScore: 70,
    pointsAwarded: 1,
    questions: [
      {
        text: 'What is the time complexity of searching in a balanced Binary Search Tree (BST)?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
        correctIndex: 1,
        explanation: 'In a balanced BST, each comparison halves the remaining search space, giving O(log n) time complexity.',
        difficulty: 'easy',
      },
      {
        text: 'Which sorting algorithm has the best average-case time complexity?',
        options: ['Bubble Sort – O(n²)', 'Merge Sort – O(n log n)', 'Selection Sort – O(n²)', 'Insertion Sort – O(n²)'],
        correctIndex: 1,
        explanation: 'Merge Sort guarantees O(n log n) in all cases by dividing and merging. It\'s more predictable than Quick Sort (which can degrade to O(n²) without good pivot selection).',
        difficulty: 'easy',
      },
      {
        text: 'What data structure is best suited for implementing a BFS (Breadth-First Search)?',
        options: ['Stack', 'Queue', 'Priority Queue', 'Deque'],
        correctIndex: 1,
        explanation: 'BFS explores nodes level by level. A queue (FIFO) ensures nodes are processed in the order they are discovered.',
        difficulty: 'easy',
      },
      {
        text: 'What is the space complexity of a recursive DFS on a graph with V vertices and E edges?',
        options: ['O(1)', 'O(V)', 'O(E)', 'O(V + E)'],
        correctIndex: 1,
        explanation: 'The call stack depth of recursive DFS is at most V (one frame per vertex in the worst-case path), so space complexity is O(V).',
        difficulty: 'medium',
      },
      {
        text: 'Which of the following data structures gives O(1) average-case insert, delete, and lookup?',
        options: ['Sorted Array', 'Linked List', 'Hash Map', 'AVL Tree'],
        correctIndex: 2,
        explanation: 'Hash maps provide O(1) average-case for all three operations. Worst case is O(n) due to collisions, but a good hash function makes this rare.',
        difficulty: 'easy',
      },
      {
        text: 'In Dynamic Programming, what does "overlapping subproblems" mean?',
        options: [
          'The problem can be broken into independent subproblems',
          'The same subproblems are solved multiple times in naive recursion',
          'Each subproblem is solved exactly once',
          'Subproblems share the same time complexity',
        ],
        correctIndex: 1,
        explanation: 'Overlapping subproblems means the recursive solution revisits the same sub-cases repeatedly. Memoization or tabulation avoids recomputation.',
        difficulty: 'medium',
      },
      {
        text: 'What is a min-heap property?',
        options: [
          'Every parent node is greater than its children',
          'Every parent node is less than or equal to its children',
          'The root always stores the maximum value',
          'All leaves are at the same depth',
        ],
        correctIndex: 1,
        explanation: 'In a min-heap, each parent is ≤ its children, so the minimum element is always at the root, enabling O(1) min access and O(log n) insert/delete.',
        difficulty: 'easy',
      },
      {
        text: 'What does Dijkstra\'s algorithm compute?',
        options: [
          'Minimum spanning tree of a graph',
          'Shortest path from a source to all vertices in a weighted graph (non-negative weights)',
          'All-pairs shortest paths',
          'Longest path in a DAG',
        ],
        correctIndex: 1,
        explanation: 'Dijkstra\'s algorithm finds the shortest path from a single source to all other vertices. It requires non-negative edge weights.',
        difficulty: 'medium',
      },
      {
        text: 'Which of the following has O(1) amortised insertion at the end?',
        options: ['Linked List (tail known)', 'Dynamic Array (e.g. ArrayList)', 'Both of the above', 'Neither'],
        correctIndex: 2,
        explanation: 'A linked list with a tail pointer inserts in O(1). A dynamic array doubles capacity when full, making each individual insert occasionally O(n) but amortised O(1).',
        difficulty: 'medium',
      },
      {
        text: 'What is the output of post-order traversal on a BST with values 4, 2, 6, 1, 3, 5, 7?',
        options: ['1 2 3 4 5 6 7', '4 2 6 1 3 5 7', '1 3 2 5 7 6 4', '4 2 1 3 6 5 7'],
        correctIndex: 2,
        explanation: 'Post-order: left → right → root. For this tree: 1, 3, 2, 5, 7, 6, 4.',
        difficulty: 'hard',
      },
    ],
  },
  {
    title: 'Computer Networks',
    category: 'networking',
    timeLimitMinutes: 15,
    passScore: 70,
    pointsAwarded: 1,
    questions: [
      {
        text: 'Which protocol is responsible for assigning IP addresses automatically?',
        options: ['DNS', 'DHCP', 'ARP', 'ICMP'],
        correctIndex: 1,
        explanation: 'DHCP (Dynamic Host Configuration Protocol) dynamically assigns IP addresses, subnet masks, and default gateways to network devices.',
        difficulty: 'easy',
      },
      {
        text: 'What is the primary purpose of ARP?',
        options: [
          'Resolve domain names to IP addresses',
          'Map IP addresses to MAC addresses on a local network',
          'Encrypt data in transit',
          'Route packets between different networks',
        ],
        correctIndex: 1,
        explanation: 'ARP (Address Resolution Protocol) resolves an IP address to the corresponding MAC address on a LAN by broadcasting a request.',
        difficulty: 'easy',
      },
      {
        text: 'Which layer of the TCP/IP model handles end-to-end communication (ports, reliability)?',
        options: ['Network', 'Transport', 'Application', 'Data Link'],
        correctIndex: 1,
        explanation: 'The Transport layer (TCP/UDP) handles port-based process-to-process communication, flow control, and (for TCP) reliable delivery.',
        difficulty: 'easy',
      },
      {
        text: 'What is the difference between TCP and UDP?',
        options: [
          'TCP is connectionless; UDP is connection-oriented',
          'TCP guarantees delivery and order; UDP does not',
          'UDP is only used for HTTP; TCP is used for video streaming',
          'TCP operates at the network layer; UDP at transport',
        ],
        correctIndex: 1,
        explanation: 'TCP provides reliable, ordered delivery with acknowledgements and retransmission. UDP is faster but unreliable, used for latency-sensitive apps like gaming and video.',
        difficulty: 'easy',
      },
      {
        text: 'What does a subnet mask of /24 (255.255.255.0) imply?',
        options: [
          '16 million possible hosts',
          '254 usable host addresses on the subnet',
          '65,534 usable host addresses',
          '512 usable host addresses',
        ],
        correctIndex: 1,
        explanation: 'A /24 subnet has 8 host bits → 2^8 = 256 addresses. Subtract network and broadcast = 254 usable host addresses.',
        difficulty: 'medium',
      },
      {
        text: 'Which HTTP status code indicates that a resource has been permanently moved?',
        options: ['200', '301', '404', '503'],
        correctIndex: 1,
        explanation: '301 Moved Permanently tells clients and search engines that the resource has permanently moved to a new URL.',
        difficulty: 'easy',
      },
      {
        text: 'What is the three-way handshake in TCP?',
        options: [
          'SYN → ACK → FIN',
          'SYN → SYN-ACK → ACK',
          'HELLO → HELLO-ACK → READY',
          'RST → SYN → ACK',
        ],
        correctIndex: 1,
        explanation: 'TCP connection setup: client sends SYN, server replies SYN-ACK, client sends ACK. This synchronises sequence numbers for both directions.',
        difficulty: 'easy',
      },
      {
        text: 'What is the role of DNS?',
        options: [
          'Assign IP addresses dynamically',
          'Translate human-readable domain names to IP addresses',
          'Encrypt web traffic',
          'Route packets between autonomous systems',
        ],
        correctIndex: 1,
        explanation: 'DNS (Domain Name System) acts like the internet\'s phone book, resolving domain names (e.g. google.com) to IP addresses.',
        difficulty: 'easy',
      },
      {
        text: 'Which routing protocol is used between autonomous systems on the internet?',
        options: ['OSPF', 'RIP', 'BGP', 'EIGRP'],
        correctIndex: 2,
        explanation: 'BGP (Border Gateway Protocol) is the inter-domain routing protocol that exchanges routing information between autonomous systems on the internet.',
        difficulty: 'hard',
      },
      {
        text: 'What does NAT (Network Address Translation) do?',
        options: [
          'Encrypts all outbound traffic',
          'Maps multiple private IP addresses to one or more public IPs',
          'Assigns MAC addresses to network devices',
          'Balances load across multiple servers',
        ],
        correctIndex: 1,
        explanation: 'NAT allows a router to map many private LAN addresses to a single public IP, conserving the IPv4 address space and providing a layer of obscurity.',
        difficulty: 'medium',
      },
    ],
  },
  {
    title: 'Web Development & APIs',
    category: 'web_dev',
    timeLimitMinutes: 15,
    passScore: 70,
    pointsAwarded: 1,
    questions: [
      {
        text: 'What does REST stand for?',
        options: [
          'Rapid Execution State Transfer',
          'Representational State Transfer',
          'Remote Execution Service Technology',
          'Reliable Encrypted Secure Transfer',
        ],
        correctIndex: 1,
        explanation: 'REST – Representational State Transfer – is an architectural style for distributed hypermedia systems, defined by constraints like statelessness and uniform interface.',
        difficulty: 'easy',
      },
      {
        text: 'Which HTTP method is idempotent AND safe (no side effects)?',
        options: ['POST', 'PUT', 'GET', 'DELETE'],
        correctIndex: 2,
        explanation: 'GET is both safe (no server-state change) and idempotent (multiple identical requests produce the same result). POST is neither; PUT is idempotent but not safe.',
        difficulty: 'medium',
      },
      {
        text: 'What is the purpose of CORS?',
        options: [
          'Compress API responses for faster delivery',
          'Allow or restrict cross-origin HTTP requests in browsers',
          'Encrypt cookies between client and server',
          'Cache static assets at the CDN level',
        ],
        correctIndex: 1,
        explanation: 'CORS (Cross-Origin Resource Sharing) is a browser security mechanism that uses HTTP headers to control which origins are permitted to read responses from a server.',
        difficulty: 'medium',
      },
      {
        text: 'What does an httpOnly cookie prevent?',
        options: [
          'The cookie being sent over HTTP (only HTTPS allowed)',
          'JavaScript running on the page from accessing the cookie',
          'The cookie being sent in cross-origin requests',
          'The server from reading the cookie value',
        ],
        correctIndex: 1,
        explanation: 'The httpOnly flag prevents client-side JavaScript from accessing the cookie via document.cookie, protecting against XSS token theft.',
        difficulty: 'medium',
      },
      {
        text: 'Which of the following is a JWT (JSON Web Token) claim that specifies when the token expires?',
        options: ['iss', 'sub', 'exp', 'aud'],
        correctIndex: 2,
        explanation: '"exp" (expiration time) is the registered JWT claim indicating when the token must no longer be accepted. It is a NumericDate (Unix timestamp).',
        difficulty: 'medium',
      },
      {
        text: 'What is the difference between authentication and authorisation?',
        options: [
          'Authentication verifies who you are; authorisation determines what you can do',
          'They are interchangeable terms for the same process',
          'Authorisation verifies identity; authentication grants permissions',
          'Authentication only applies to APIs; authorisation applies to UIs',
        ],
        correctIndex: 0,
        explanation: 'Authentication proves identity (login). Authorisation decides what that identity is permitted to do (RBAC, permissions). Auth then authz.',
        difficulty: 'easy',
      },
      {
        text: 'What does a 429 HTTP status code mean?',
        options: [
          'Internal Server Error',
          'Unauthorised – missing credentials',
          'Too Many Requests – client is rate limited',
          'Gateway Timeout',
        ],
        correctIndex: 2,
        explanation: '429 Too Many Requests is returned when a client exceeds the rate limit. Servers should include a Retry-After header.',
        difficulty: 'easy',
      },
      {
        text: 'In a RESTful API, which HTTP verb should be used to partially update a resource?',
        options: ['PUT', 'POST', 'PATCH', 'UPDATE'],
        correctIndex: 2,
        explanation: 'PATCH partially updates a resource (only the supplied fields). PUT replaces the entire resource. UPDATE is not an HTTP verb.',
        difficulty: 'easy',
      },
      {
        text: 'What is the purpose of database indexing?',
        options: [
          'To enforce uniqueness constraints on columns',
          'To speed up read queries by creating auxiliary data structures',
          'To encrypt sensitive fields at rest',
          'To shard data across multiple nodes',
        ],
        correctIndex: 1,
        explanation: 'An index (B-tree, hash, etc.) allows the database to locate rows without scanning the entire table, dramatically reducing query time at the cost of slightly slower writes.',
        difficulty: 'medium',
      },
      {
        text: 'Which of the following best describes XSS (Cross-Site Scripting)?',
        options: [
          'Tricking a user into making an unintended authenticated request',
          'Injecting malicious scripts into content that is viewed by other users',
          'Intercepting network traffic between client and server',
          'Brute-forcing an API endpoint with automated requests',
        ],
        correctIndex: 1,
        explanation: 'XSS involves injecting malicious client-side scripts into web pages. When other users view the page the script executes in their browser, potentially stealing cookies or credentials.',
        difficulty: 'medium',
      },
    ],
  },
  {
    title: 'Operating Systems',
    category: 'os',
    timeLimitMinutes: 15,
    passScore: 70,
    pointsAwarded: 1,
    questions: [
      {
        text: 'What is the main purpose of virtual memory?',
        options: [
          'Speed up CPU execution',
          'Allow processes to use more memory than physically available by using disk as an extension',
          'Encrypt memory contents from other processes',
          'Provide direct hardware access to user applications',
        ],
        correctIndex: 1,
        explanation: 'Virtual memory uses a paging system to transparently swap pages between RAM and disk, giving each process the illusion of a large contiguous address space.',
        difficulty: 'easy',
      },
      {
        text: 'What is a deadlock?',
        options: [
          'A process that loops indefinitely consuming CPU',
          'A situation where two or more processes are waiting for each other\'s resources, halting progress',
          'Memory corruption caused by a buffer overflow',
          'A race condition in a multithreaded application',
        ],
        correctIndex: 1,
        explanation: 'Deadlock occurs when each process in a set is waiting for a resource held by another process in the set, causing all to wait indefinitely.',
        difficulty: 'easy',
      },
      {
        text: 'Which CPU scheduling algorithm can cause starvation?',
        options: ['Round Robin', 'First-Come First-Served', 'Priority Scheduling', 'Shortest Job First'],
        correctIndex: 2,
        explanation: 'Priority Scheduling can starve low-priority processes if high-priority processes continuously arrive. Ageing (increasing priority over time) is the standard fix.',
        difficulty: 'medium',
      },
      {
        text: 'What is the difference between a process and a thread?',
        options: [
          'Processes share memory; threads do not',
          'Threads are independent units; processes share a parent\'s resources',
          'A process is an independent unit with its own address space; threads within a process share memory',
          'Threads are scheduled by the OS; processes are not',
        ],
        correctIndex: 2,
        explanation: 'A process has its own isolated address space. Threads within the same process share heap and global memory but have separate stacks, enabling lighter-weight concurrency.',
        difficulty: 'easy',
      },
      {
        text: 'What does the kernel\'s "context switch" involve?',
        options: [
          'Switching the CPU from user mode to kernel mode',
          'Saving the state of the current process and restoring the state of the next scheduled process',
          'Moving a process from one CPU core to another',
          'Loading a shared library into process memory',
        ],
        correctIndex: 1,
        explanation: 'A context switch saves the running process\'s registers, program counter, and stack pointer, then restores those of the next process to run – enabling multitasking.',
        difficulty: 'medium',
      },
      {
        text: 'What does the POSIX fork() system call do?',
        options: [
          'Creates a new thread in the current process',
          'Creates a child process that is a copy of the parent',
          'Loads a new executable into the current process',
          'Terminates the current process',
        ],
        correctIndex: 1,
        explanation: 'fork() duplicates the calling process; both parent and child continue from the next instruction. The return value distinguishes them: 0 in child, child\'s PID in parent.',
        difficulty: 'medium',
      },
      {
        text: 'What is a semaphore used for in OS?',
        options: [
          'Storing process state during a context switch',
          'Scheduling CPU-bound processes',
          'Synchronising access to shared resources between concurrent processes or threads',
          'Managing virtual memory page tables',
        ],
        correctIndex: 2,
        explanation: 'A semaphore is a synchronisation primitive (integer counter + wait/signal operations) used to control access to shared resources and avoid race conditions.',
        difficulty: 'medium',
      },
      {
        text: 'Which page-replacement algorithm is optimal (lowest page faults) but impractical in real systems?',
        options: ['LRU', 'FIFO', 'Optimal (OPT / Belady\'s)', 'Clock'],
        correctIndex: 2,
        explanation: 'The Optimal algorithm replaces the page that will not be used for the longest time in the future. It is optimal by definition but requires future knowledge, making it impractical.',
        difficulty: 'hard',
      },
      {
        text: 'What is a race condition?',
        options: [
          'A process that runs faster than others due to priority',
          'A bug where the output depends on the non-deterministic timing/order of concurrent operations',
          'A CPU pipeline hazard caused by branch misprediction',
          'Memory contention between two CPUs',
        ],
        correctIndex: 1,
        explanation: 'A race condition arises when the outcome of a program depends on the sequence or timing of uncontrollable events (like thread scheduling), producing non-deterministic bugs.',
        difficulty: 'medium',
      },
      {
        text: 'What is the purpose of the Translation Lookaside Buffer (TLB)?',
        options: [
          'Store recently used disk blocks in RAM',
          'Cache recent virtual-to-physical address mappings to speed up memory access',
          'Buffer keyboard input before passing it to the OS',
          'Translate between IPv4 and IPv6 addresses',
        ],
        correctIndex: 1,
        explanation: 'The TLB is a small, fast cache inside the MMU that stores recent page-table entries. A TLB hit avoids a full page-table walk, dramatically speeding up virtual memory access.',
        difficulty: 'hard',
      },
    ],
  },
];

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  let created = 0, updated = 0;

  for (const quizData of QUIZZES) {
    const result = await Quiz.findOneAndUpdate(
      { title: quizData.title },
      quizData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    if (result.createdAt?.getTime() === result.updatedAt?.getTime()) {
      created++;
    } else {
      updated++;
    }
    console.log(`  ✓ ${quizData.title} (${quizData.questions.length} questions)`);
  }

  console.log(`\nDone: ${QUIZZES.length} quizzes seeded (${created} created, ${updated} updated)`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
